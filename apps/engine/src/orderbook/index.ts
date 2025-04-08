import assert from "minimalistic-assert";
import type { Order, OrderFill, OrderRequest, OrderStatus, Side } from "../schema";
import { Engine } from "../engine";

export class Orderbook{
    public market: string;
    public bids: Order[];
    public asks: Order[];
    public base_asset: string;
    public quote_asset: string;
    public market_price: string;
    public is_locked:boolean;
    public last_trade_id: number;
    public last_update_id: number;

    constructor(market: string,base_asset: string, quote_asset: string,bids: Order[], asks: Order[],market_price?: string, last_trade_id?: number,last_update_id?: number){
        this.market = market;
        this.bids = bids;
        this.asks = asks;
        this.base_asset = base_asset;
        this.quote_asset = quote_asset;
        this.market_price = market_price ?? "0.00";
        this.last_trade_id = last_trade_id ?? 0;
        this.last_update_id = last_update_id ?? 0;
        this.is_locked = false;
    }

    public get_ticker(){
        return `${this.base_asset}_${this.quote_asset}`;
    }

    public place_bid(order: Order){

        this.bids.sort((a,b) => Number.parseFloat(b.p) - Number.parseFloat(a.p));
        const insert_bid_at = this.find_insert_position("BID", Number.parseFloat(order.p));

        this.bids.splice(insert_bid_at,0,order);
        this.last_update_id += 1;
    }

    public place_ask(order: Order){
        this.asks.sort((a,b) => Number.parseFloat(a.p) - Number.parseFloat(b.p));
        const insert_ask_at = this.find_insert_position("ASK", Number.parseFloat(order.p));

        this.asks.splice(insert_ask_at,0,order);
        this.last_update_id += 1;
    }

    public process_order(side: Side, order: OrderRequest){
        // OVERDEFENSIVE -- GONNA REMOVE AFTER WRITTING TESTS.
        this.bids.sort((a,b) => Number.parseFloat(b.p) - Number.parseFloat(a.p));
        this.asks.sort((a,b) => Number.parseFloat(a.p) - Number.parseFloat(b.p));

        let order_status:OrderStatus = "NOT_FILLED";

        let order_quan = Number.parseFloat(order.q);
        let order_price_float = Number.parseFloat(order.p);

        let fills: OrderFill[] = [];

        if(side === 'ASK'){
            if(this.bids.length === 0){
                this.place_ask({
                    id: order.id,
                    p: order.p,
                    q: order.q,
                    eq: "0.00",
                    ca: order.ca,
                    s: "ASK"
                });
                return {
                    id: order.id,
                    status: "NEW" as const,
                };;
            }

            const cumulative_bids:{
                price: string,
                quantity: number,
            }[] = [];

            let prev_price = this.bids[0]!.p;
            let quantity_sum = Number.parseFloat(this.bids[0]!.q);

            for(let i = 1; i < this.bids.length; i++){
                if(this.bids[i]!.p === prev_price){
                    quantity_sum += Number.parseFloat(this.bids[i]!.q)
                }else{
                    cumulative_bids.push({
                        price: prev_price,
                        quantity: quantity_sum,
                    });

                    prev_price = this.bids[i]!.p;
                    quantity_sum = Number.parseFloat(this.bids[i]!.q);
                }
            }

            cumulative_bids.push({
                price: prev_price,
                quantity: quantity_sum
            });

            const cbid_len = cumulative_bids.length;
            // TODO: Implements fills
            // TODO: Verify if last_order_id and market price are updated correctly

            for(let i = 0; i < cbid_len; i++){
                const cbid_p = Number.parseFloat(cumulative_bids[i]!.price);
                
                if(order_quan <= 0 || cbid_p < order_price_float)
                    break;

                for(let j = i; j < this.bids.length; j++){
                    const order_q = Number.parseFloat(this.bids[j]!.q);
                    const order_p = Number.parseFloat(this.bids[j]!.p);

                    if(order_p < cbid_p || order_quan <= 0)
                        break;
                    else if(order_p > cbid_p)
                        continue;

                    // three cases possible
                    // 1. order_quan is more than order_q
                    // 2. order_quan is less than order_q
                    // 3. order_quan is equal to order_q

                    if(order_q < order_quan){
                        // the current bid quantity is less than order
                        // we remove the bid order from order book by setting 
                        // q = 0.00 and continue to match
                        console.log(`Order ${this.bids[j]!.id} matched`);
                        this.last_update_id += 1;
                        this.last_trade_id += 1;
                        this.market_price = this.bids[j]!.p;
                        fills.push({
                            market_order_id: this.bids[j]!.id,
                            quan: this.float_to_str(order_quan),
                            trade_id: this.last_trade_id,
                            price: this.market_price,
                        });
                        order_quan -= order_q;
                        this.bids[j]!.q = "0.00";
                        order_status = "PART_FILLED";
                    }
                    else{
                        // the current bid quantity is more than order quantity
                        // we update the quantity of bid order
                        // we declare the order as FILLED the next iteration is 
                        // gonna short circuit both inner and outer loop
                        this.bids[j]!.q = this.float_to_str(order_q - order_quan);
                        this.last_update_id += 1;
                        this.last_trade_id += 1;
                        this.market_price = this.bids[j]!.p;
                        fills.push({
                            market_order_id: this.bids[j]!.id,
                            quan: this.float_to_str(order_quan),
                            trade_id: this.last_trade_id,
                            price: this.market_price,
                        });
                        order_quan = 0;
                        order_status = "FILLED";
                    }
                    Engine.get_instance().stream_depth(this.market,this.market_price,"BID");
                    // ternary operator ??
                }

            }

            // we update the orderbook by removing matched bids from the order book
            this.bids = this.bids.filter((bid) => Number.parseFloat(bid.q) > 0.00)

            if(order_status !== "FILLED"){
                // if the order is not fully filled place 
                // that on the order book
                assert(order_quan > 0);
                const eq = Number.parseFloat(order.q) - order_quan;
                this.place_ask({
                    id: order.id,
                    p: order.p,
                    q: this.float_to_str(order_quan),
                    eq: this.float_to_str(eq),
                    ca: order.ca,
                    s: side,
                });
            }
            
        }
        else{
            if(this.asks.length === 0)
            {
                this.place_bid({
                    id: order.id,
                    p: order.p,
                    q: order.q,
                    eq: "0.00",
                    ca: order.ca,
                    s: side
                });
                return {
                    id: order.id,
                    status: "NEW" as const,
                };
            }

            let cumulative_asks: {
                price: string,
                quantity: number
            }[] = [];

            let prev_price = this.asks[0]!.p;
            let quantity_sum = Number.parseFloat(this.asks[0]!.q);

            for(let i = 1; i < this.asks.length; i++){
                if(prev_price === this.asks[i]!.p){
                    quantity_sum += Number.parseFloat(this.asks[i]!.q);
                } else{
                    cumulative_asks.push({
                        price: prev_price,
                        quantity: quantity_sum
                    });

                    prev_price = this.asks[i]!.p;
                    quantity_sum = Number.parseFloat(this.asks[i]!.q);
                }
            }

            cumulative_asks.push({
                price: prev_price,
                quantity: quantity_sum
            });

            let cask_len = cumulative_asks.length; 

            // TODO: Implements fills
            // TODO: Verify if last_order_id and market price are updated correctly

            for(let i = 0; i < cask_len; i++){
                const cask_p = Number.parseFloat(cumulative_asks[i]!.price);

                if(cask_p > order_price_float || order_quan <= 0)
                    break;

                for(let j = i; j < this.asks.length; j++){
                    const ask_p = Number.parseFloat(this.asks[j]!.p);
                    const ask_q = Number.parseFloat(this.asks[j]!.q);

                    if(cask_p < ask_p || order_quan <= 0)
                        break;
                    else if(cask_p > ask_p)
                        continue;
                    
                    // there are three cases 
                    // 1. ask_q is more than order_quan
                    // 2. ask_q is less than order_quan
                    // 3. ask_q is equal to order_quan

                    if(ask_q < order_quan){
                        // order quantity is more than current ask order on the orderbook
                        // we mark the ask order for removal by marking q = "0.00"
                        // and continue to match order for asks above it the orderbook
                        console.log(`Order ${this.asks[j]!.id} matched`);
                        order_quan -= ask_q;
                        this.asks[j]!.q = "0.00";
                        this.last_update_id += 1;
                        this.last_trade_id += 1;
                        this.market_price = this.asks[j]!.p;
                        fills.push({
                            price: this.market_price,
                            quan: this.float_to_str(ask_q),
                            market_order_id: this.asks[j]!.id,
                            trade_id: this.last_trade_id,
                        })
                        order_status = "PART_FILLED";
                    }else{
                        // order quantity is less than or equal to current ask order on the orderbook
                        // we update the quantity of ask order
                        // mark the order as FILLED and set order_quan = 0
                        // the next iteration of loops are going to be short circuited
                        console.log(`New order filled completely`);
                        this.asks[j]!.q = this.float_to_str(ask_q - order_quan);
                        this.last_update_id += 1;
                        this.last_trade_id += 1; 
                        this.market_price = this.asks[j]!.p;
                        fills.push({
                            price: this.market_price,
                            quan: this.float_to_str(order_quan),
                            market_order_id: this.asks[j]!.id,
                            trade_id: this.last_trade_id,
                        });
                        order_status = "FILLED";
                        order_quan = 0;
                    }
                    Engine.get_instance().stream_depth(this.market,this.market_price,"ASK");

                }
            }

            this.asks = this.asks.filter((ask) => Number.parseFloat(ask.q) > 0.00);

            if(order_status !== "FILLED"){
                // if order is not fully FILLED then place it
                // on the orderbook
                assert(order_quan > 0);
                const eq = Number.parseFloat(order.q) - order_quan;
                this.place_bid({
                    id: order.id,
                    p: order.p,
                    q: this.float_to_str(order_quan),
                    eq: this.float_to_str(eq),
                    ca: order.ca,
                    s: side
                });
            }

        }

        if(order_status === "NOT_FILLED"){
            return {
                id: order.id,
                status: "NEW" as const,
            };
        }
        else{
            const executed_quan = Number.parseFloat(order.q) - order_quan;
            return {
                id: order.id,
                status: order_status,
                executed_quan: this.float_to_str(executed_quan),
                quan: this.float_to_str(order_quan),
                fills,
            };
        }

    }

    public cancel_order(id: string){
        let order;
        for(let i = 0; i < this.bids.length; i++){
            if(this.bids[i]!.id === id){
                const bid = this.bids[i]!;
                order = {
                    symbol: this.market,
                    id: bid.id,
                    price: bid.p,
                    quan: bid.q,
                    exec_quan: bid.eq,
                    created_at: bid.ca,
                    side: bid.s,
                };
                this.bids.splice(i,1);
                this.is_locked = false;
            }
        }
        for(let i = 0; i < this.asks.length; i++){
            if(this.asks[i]!.id === id){
                const ask = this.asks[i]!;
                order = {
                    symbol: this.market,
                    id: ask.id,
                    price: ask.p,
                    quan: ask.q,
                    exec_quan: ask.eq,
                    created_at: ask.ca,
                    side: ask.s,
                }
                this.asks.splice(i,1);
                this.is_locked = false;
            }
        }

        return order;
    }

    public get_depth(){
        const cumulative_bids:{
            price: string,
            quantity: number,
        }[] = [];

        if(this.bids.length > 0){
            let prev_price = this.bids[0]!.p;
            let quantity_sum = Number.parseFloat(this.bids[0]!.q);

            for(let i = 1; i < this.bids.length; i++){
                if(this.bids[i]!.p === prev_price){
                    quantity_sum += Number.parseFloat(this.bids[i]!.q)
                }else{
                    cumulative_bids.push({
                        price: prev_price,
                        quantity: quantity_sum,
                    });

                    prev_price = this.bids[i]!.p;
                    quantity_sum = Number.parseFloat(this.bids[i]!.q);
                }
            }

            cumulative_bids.push({
                price: prev_price,
                quantity: quantity_sum
            });
        }

        let cumulative_asks: {
            price: string,
            quantity: number
        }[] = [];

        if(this.asks.length > 0){
            let prev_price = this.asks[0]!.p;
            let quantity_sum = Number.parseFloat(this.asks[0]!.q);

            for(let i = 1; i < this.asks.length; i++){
                if(prev_price === this.asks[i]!.p){
                    quantity_sum += Number.parseFloat(this.asks[i]!.q);
                } else{
                    cumulative_asks.push({
                        price: prev_price,
                        quantity: quantity_sum
                    });

                    prev_price = this.asks[i]!.p;
                    quantity_sum = Number.parseFloat(this.asks[i]!.q);
                }
            }

            cumulative_asks.push({
                price: prev_price,
                quantity: quantity_sum
            });
        }

        const asks = cumulative_asks.map((ask) => [ask.price,ask.quantity.toFixed(2)] as const);
        const bids = cumulative_bids.map((bid) => [bid.price,bid.quantity.toFixed(2)] as const);
        return {
            asks: asks,
            bids: bids,
            last_update_id: this.last_update_id.toString(),
            timestamp: Date.now()
        }
    }

    public get_open_order(order_id: string){
        return [...this.asks,...this.bids].find((o) => o.id === order_id);
    }

    public lock_orderbook(){
        if(this.is_locked === true)
            throw new Error("Orderbook is already locked");

        this.is_locked = true;
    }

    public unlock_orderbook(){
        if(this.is_locked === false)
            throw new Error("Orderbook is already unlocked");

        this.is_locked = false;
    }

    public get_snapshot(){
        return {
            market_price: this.market_price,
            last_trade_id: this.last_trade_id,
            asks: this.asks,
            bids: this.bids
        }
    }

    private find_insert_position(side: "BID" | "ASK", order_price: number){
        const arr = side  === "ASK" ? this.asks : this.bids;

        let low = 0, high = arr.length-1;

        let insert_at = 0;

        try{
            while(low <= high){
                const mid = low + ((high - low) >> 1);
                const price_mid_str = arr[mid]?.p;
                assert(price_mid_str !== undefined, "Bid or Ask should exist");
    
                const price = Number.parseFloat(price_mid_str);
    
                if(price == order_price)
                    return mid;
                else if(price > order_price)
                {
                    high = mid - 1;
    
                    if(mid === 0)
                    {
                        insert_at = mid;
                        // improve this logic to promote quantity based preference.
                        break;
                    }
    
                    const niegh_price_str = arr[high]!.p;

                    const niegh_price = Number.parseFloat(niegh_price_str);
    
                    if(niegh_price < price)
                    {
                        insert_at = mid;
                        break;
                    }
                }
                else{
                    low = mid + 1;
    
                    if(mid === arr.length - 1)
                    {
                        insert_at = mid;
                        break;
                    }
    
                    const niegh_price_str = arr[low]!.p;

                    const niegh_price = Number.parseFloat(niegh_price_str);
    
                    if(niegh_price > price)
                    {
                        insert_at = mid;
                        break;
                    }
                }
            }
    
            return insert_at;
        }
        catch(err){
            console.log('ERROR WHILE INSERTING ORDER');
            console.log(err);
            return 0;
        }

    }

    private float_to_str(num: number){
        const fnum = num.toFixed(2);
        return fnum.toString();
    }
}