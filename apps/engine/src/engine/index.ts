import fs from "fs";
import * as v from "valibot";
import { Orderbook } from "../orderbook";
import { orderbook_snapshot, type Order,type OrderbookSnapshot,type Side } from "../schema";
import type { Buffer, WSDepthStream, WSTradeStream } from "../schema";
import { MARKETS } from "../const";
import { RedisManager } from "../redis_manager";
import { epoch_in_micros } from "../utils";

type Market = string;

export class Engine{
    private static instance: Engine;
    private orderbooks: Map<Market,Orderbook>;
    private buffered_orders: Buffer;

    private constructor(){
        let raw_snapshot = null
        try {
            if (process.env.WITH_SNAPSHOT) {
                raw_snapshot = fs.readFileSync("./snapshot.json","utf-8");
            }
        } catch (e) {
            console.log("No snapshot found");
        }
        const parsed = v.safeParse(orderbook_snapshot,JSON.parse(raw_snapshot ?? ""));

        if(parsed.success){
            const orderbooks = parsed.output.orderbooks;
            const mapped = orderbooks.map((o) => {
                const {base_asset, quote_asset} = this.destruct_ticket(o.market);
                return [o.market, new Orderbook(o.market,base_asset,quote_asset,o.bids, o.asks,o.market_price,o.last_trade_id)] as const;
            });
            this.orderbooks = new Map(mapped)
        }
        else{

            const mapped = MARKETS.map((market) => {
                const { base_asset, quote_asset } = this.destruct_ticket(market);
                return [market, new Orderbook(market,base_asset, quote_asset,[],[], "0.00", -1)] as const;
            })
            
            this.orderbooks = new Map(mapped)
        }
        this.buffered_orders = [];
        this.init_take_snapshot();
        
    }

    public static get_instance(){
        if(!Engine.instance)
        {
            Engine.instance = new Engine();
        }

        return Engine.instance;
    }

    public health_check(){
        console.log("ENGINE HEALTHY");
        return true;
    }

    public get_orderbook(market: string){
        const orderbook = this.orderbooks.get(market);
        if(orderbook === undefined)
        {
            throw new Error(`Orderbook for market ${market} doesn't exists.`)
        }

        return orderbook;
    }

    public process_order(user_id: string,market: string, side: Side, order: {
        client_id: number,
        p: string,
        q: string,
        ca: number,
    }){
        const orderbook = this.get_orderbook(market);

        const order_id = this.assign_order_id(user_id,orderbook.market,orderbook.last_update_id);

        if(orderbook.is_locked)
        {
            this.buffered_orders.push({ACTION: "EXECUTE", DETAILS: {
                user_id,
                market,
                side,
                order: {
                    q: order.q,
                    p: order.p,
                    id: order_id,
                    s: side
                }
            }});
            return;
        }
        orderbook.lock_orderbook();
        try{
            const processed_order = orderbook.process_order(
                side,
                {
                    q: order.q,
                    p: order.p,
                    id: order_id,
                    ca: order.ca,
                }
            );
            const publisher_payload = {
                TYPE: 'EXECUTE_ORDER',
                PAYLOAD: processed_order
            }
            // TODO: Process buffered orders before opening the lock again.
            orderbook.unlock_orderbook();
            RedisManager.get_instance().publish_to_api(order.client_id.toString(),JSON.stringify(publisher_payload));
            this.stream_depth(market,order.p,side);
            if(processed_order.fills && processed_order.fills.length > 0){
                this.stream_trade(market,order_id,side,processed_order.fills);
                const timestamp = epoch_in_micros();
                const iso_timestamp = new Date(Math.floor(timestamp/1000)).toISOString();
                processed_order.fills.forEach((fill) => {
                    this.push_trade_to_db_queue({
                        price: fill.price,
                        iso_timestamp: iso_timestamp,
                        quantity: fill.quan,
                        symbol: market
                    })
                })
            }
            
        }catch(err){
            console.log(err);
            const publisher_payload = {
                TYPE: 'EXECUTE_ORDER',
                PAYLOAD: undefined
            }
            // TODO: Process buffered orders before opening the lock again.
            orderbook.unlock_orderbook();
            RedisManager.get_instance().publish_to_api(order.client_id.toString(),JSON.stringify(publisher_payload));
        }
    }

    public cancel_order(user_id: string,market: string,order_ids: {
        client_id: number,
        id: string,
    }){
        const orderbook = this.get_orderbook(market); 

        if(orderbook.is_locked){
            this.buffered_orders.push({
                ACTION: "CANCEL",
                DETAILS: {
                    user_id,
                    market: market,
                    id: order_ids.id
                }
            })
        }

        try{
            const possibly_deleted_order = orderbook.cancel_order(order_ids.id);
            const publisher_payload = {
                TYPE: "CANCEL_ORDER",
                PAYLOAD: possibly_deleted_order
            }
            RedisManager.get_instance().publish_to_api(order_ids.client_id.toString(),JSON.stringify(publisher_payload));
            
            if(possibly_deleted_order !== undefined){
                this.stream_depth(market,possibly_deleted_order.price,possibly_deleted_order.side);
            }
        }catch(err){
            console.log(err);
        }
    }

    public get_depth(market: string,user_id: string){
        const orderbook = this.get_orderbook(market);

        const depth = orderbook.get_depth();
        const publisher_payload = {
            TYPE: "DEPTH",
            PAYLOAD: depth
        }
        RedisManager.get_instance().publish_to_api(user_id, JSON.stringify(publisher_payload));
    }

    public get_open_order(market: string, id: string, client_id: number){
        const orderbook = this.get_orderbook(market);

        const possible_order = orderbook.get_open_order(id);

        if(possible_order === undefined){
            RedisManager.get_instance().publish_to_api(client_id.toString(),JSON.stringify({
                TYPE: "OPEN_ORDER",
                PAYLOAD: undefined
            }));
            return;
        }

        const order_status = (possible_order.eq !== "0.00") ? 
            ( (possible_order.q !== "0.00") ? "PART_FILLED" : "FILLED") :
            "NEW";

        RedisManager.get_instance().publish_to_api(client_id.toString(),JSON.stringify({
            TYPE: "OPEN_ORDER",
            PAYLOAD: {
                id: possible_order.id,
                created_at: possible_order.ca,
                exec_quan: possible_order.eq,
                quan: possible_order.q,
                side: possible_order.s,
                status: order_status,
                price: possible_order.p,
                symbol: market,
            }
        }))
    }

    // PRIVATE METHODS

    private assign_order_id(user_id: string,market: string,last_update_id: number){
        return `${user_id}-SYB_${market}-ORD_${last_update_id++}`;
    }

    private get_snapshot(){
        let orderbook_snapshots:OrderbookSnapshot[] = [];
        for(const market of this.orderbooks.keys()){
            const orderbook = this.get_orderbook(market);
            const snapshot = orderbook.get_snapshot();

            orderbook_snapshots.push({
                market,
                last_trade_id: snapshot.last_trade_id,
                market_price: snapshot.market_price,
                asks: snapshot.asks.map(ask => ask),
                bids: snapshot.bids.map(bid => bid),
            })
        }

        const snapshot = {
            orderbooks: orderbook_snapshots
        };

        try{
            fs.writeFileSync("./snapshot.json",JSON.stringify(snapshot));
            console.log("SNAPSHOT WRITTEN")
        }catch(err){
            console.log("Error taking snapshot");
            console.log(err);
        }
    }

    private init_take_snapshot(){
        console.log("START TAKING SNAPSHOTS")
        setInterval(() => {
            this.get_snapshot()
        },1000*30)
    }

    private destruct_ticket(ticket: string){
        const assets = ticket.split("_");
        return {
            base_asset: assets[0]!,
            quote_asset: assets[1]!
        };
    }

    // --------------------- STREAMS -------------------

    public stream_depth(symbol: string, price: string, side: Side){
        const timestamp_mus = epoch_in_micros();

        const orderbook = this.get_orderbook(symbol);

        let inc_depth: WSDepthStream["a"] = [];

        if(side === "BID"){
            const ubids = orderbook.bids.filter((b) => b.p === price);
            let cbid_qt = 0.00;

            ubids.forEach((ubid) => {
                cbid_qt += Number.parseFloat(ubid.q);
            });

            inc_depth.push([price,cbid_qt.toFixed(2).toString()]);
        }else{
            const uasks = orderbook.asks.filter((uask) => uask.p === price);
            let cask_qt = 0.00;

            uasks.forEach((uask) => {
                cask_qt += Number.parseFloat(uask.q);
            });

            inc_depth.push([price,cask_qt.toFixed(2).toString()]);
        }

        if(inc_depth.length === 0){
            // when the order gets completely removed off the orderbook
            // due to cancellation or trade -- we need to stream it to the 
            // client. The client should have to logic to remove bid or ask
            // with updated quantity from the rendered view.
            inc_depth.push([price,"0.00"]);
        }

        
        const stream_payload: WSDepthStream = {
            e: "depth",
            E: timestamp_mus,
            s: symbol,
            a: side === "ASK" ? inc_depth : [],
            b: side === "BID" ? inc_depth : [],
            U: orderbook.last_update_id,
            u: orderbook.last_update_id,
            T: timestamp_mus
        };

        RedisManager.get_instance().publish_to_event_queue(`depth@${symbol}`,JSON.stringify({
            stream: `depth@${symbol}`,
            data: stream_payload
        }));
    }

    private stream_trade(symbol: string, order_id: string, side: Side, fills: {
        price: string;
        quan: string;
        trade_id: number;
        market_order_id: string;
    }[]){
        fills.forEach((fill) => {
            const timestamp_mus = epoch_in_micros();
            const stream_payload: WSTradeStream = {
                e: "trade",
                E: timestamp_mus,
                s: symbol,
                p: fill.price,
                q: fill.quan,
                b: side === "BID" ? order_id : fill.market_order_id,
                a: side === "BID" ? fill.market_order_id : order_id,
                t: fill.trade_id,
                T: timestamp_mus,
            }

            RedisManager.get_instance().publish_to_event_queue(`trade@${symbol}`,JSON.stringify({
                stream: `trade@${symbol}`,
                data: stream_payload
            }));
            // if the order wasn't filled initially the client would have "SUBSCRIBE"d to 
            // channel with uid as order.id -- we publish to it channel notifying the client
            // about the order getting FILLED.
            RedisManager.get_instance().publish_to_event_queue(`${fill.market_order_id}`,JSON.stringify({
                stream: `${fill.market_order_id}`,
                data: stream_payload
            }));
        })
    }


    // ------------------------------ PUSH TO DB QUEUE ------------

    private push_trade_to_db_queue(trade:{
        price: string,
        iso_timestamp: string,
        quantity: string,
        symbol: string,
    }){
        const msg = JSON.stringify({
            TYPE: 'trade',
            PAYLOAD: trade,
        });
        
        RedisManager.get_instance().push_to_db_queue(msg);
    }
}