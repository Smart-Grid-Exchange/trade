import fs from "fs";
import * as v from "valibot";
import { Orderbook } from "../orderbook";
import { orderbook_snapshot, type Order,type OrderbookSnapshot,type Side } from "../schema";
import type { Buffer } from "../schema";
import { MARKETS } from "../const";
import { RedisManager } from "../redis_manager";

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
                return [o.market, new Orderbook(o.market,base_asset,quote_asset,o.market_price,o.last_trade_id)] as const;
            });
            this.orderbooks = new Map(mapped)
        }
        else{

            const mapped = MARKETS.map((market) => {
                const { base_asset, quote_asset } = this.destruct_ticket(market);
                return [market, new Orderbook(market,base_asset, quote_asset, "0.00", -1)] as const;
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
                asks: snapshot.asks.map(ask => [...ask] as [string,string]),
                bids: snapshot.bids.map(bid => [...bid] as [string,string]),
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
}