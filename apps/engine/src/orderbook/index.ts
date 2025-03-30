import assert from "minimalistic-assert";
import type { Order, OrderStatus, Side } from "../schema";

export class Orderbook{
    public market: string;
    private bids: Order[];
    private asks: Order[];
    private last_updated_id: number;
    public is_locked:boolean;

    constructor(market: string){
        this.market = market;
        this.bids = [];
        this.asks = [];
        this.last_updated_id = 0;
        this.is_locked = false;
    }

    public place_bid(order: Order){

        this.bids.sort((a,b) => Number.parseFloat(b.p) - Number.parseFloat(a.p));
        const insert_bid_at = this.find_insert_position("BID", Number.parseFloat(order.p));

        this.bids.splice(insert_bid_at,0,order);
    }

    public place_ask(order: Order){
        this.asks.sort((a,b) => Number.parseFloat(a.p) - Number.parseFloat(b.p));
        const insert_ask_at = this.find_insert_position("ASK", Number.parseFloat(order.p));

        this.asks.splice(insert_ask_at,0,order);
    }

    public process_order(side: Side, order: Order){
        if(side === 'ASK'){
            if(this.bids.length === 0){
                this.place_ask(order);
                return;
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

            let order_status:OrderStatus = "NOT_FILLED";

            let order_quan = Number.parseFloat(order.q);
            let order_price_float = Number.parseFloat(order.p);

            const cbid_len = cumulative_bids.length;

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
                        console.log(`Order ${this.bids[j]!.client_id} matched`);
                        // TODO: PUBLISH THE MATCHED ORDER TO PUB/SUB

                        order_quan -= order_q;
                        this.bids[j]!.q = "0.00";
                        order_status = "PART_FILLED";
                    }
                    else{
                        // the current bid quantity is more than order quantity
                        // we update the quantity of bid order
                        // we declare the order as FILLED the next iteration is 
                        // gonna short circuit both inner and outer loop
                        this.bids[j]!.q = (order_q - order_quan).toString().slice(2);
                        order_quan = 0;
                        order_status = "FILLED";
                    }

                    // ternary operator ??
                }

            }

            // we update the orderbook by removing matched bids from the order book
            this.bids = this.bids.filter((bid) => Number.parseFloat(bid.q) > 0.00)

            if(order_status !== "FILLED"){
                // if the order is not fully filled place 
                // that on the order book
                assert(order_quan > 0);

                this.place_ask({
                    client_id: order.client_id,
                    p: order.p,
                    q: order_quan.toString().slice(2)
                });
            }
            
        }
        else{
            if(this.asks.length === 0)
            {
                this.place_bid(order);
                return;
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

            let order_status: OrderStatus = "NOT_FILLED";
            let order_price_float = Number.parseFloat(order.p);
            let order_quan = Number.parseFloat(order.q);


            let cask_len = cumulative_asks.length; 

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
                        console.log(`Order ${this.asks[j]!.client_id} matched`);
                        order_quan -= ask_q;
                        this.asks[j]!.q = "0.00";
                        order_status = "PART_FILLED";
                    }else{
                        // order quantity is less than or equal to current ask order on the orderbook
                        // we update the quantity of ask order
                        // mark the order as FILLED and set order_quan = 0
                        // the next iteration of loops are going to be short circuited
                        console.log(`New order filled completely`);
                        this.asks[j]!.q = (ask_q - order_quan).toString().slice(2);
                        order_status = "FILLED";
                        order_quan = 0;
                    }

                }
            }

            this.asks = this.asks.filter((ask) => Number.parseFloat(ask.q) > 0.00);

            if(order_status !== "FILLED"){
                // if order is not fully FILLED then place it
                // on the orderbook
                assert(order_quan > 0);

                this.place_bid({
                    client_id: order.client_id,
                    p: order.p,
                    q: order_quan.toString().slice(2)
                });
            }
        }
    }

    public cancel_order(client_id: number){
        for(let i = 0; i < this.bids.length; i++){
            if(this.bids[i]!.client_id === client_id){
                this.bids.splice(i,1);
                this.is_locked = false;
                return;
            }
        }
        for(let i = 0; i < this.asks.length; i++){
            if(this.asks[i]!.client_id === client_id){
                this.asks.splice(i,1);
                this.is_locked = false;
                return;
            }
        }

        throw new Error("Order does not exists.");
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

    private find_insert_position(side: "BID" | "ASK", order_price: number){
        const arr = side  === "ASK" ? this.asks : this.bids;

        let low = 0, high = arr.length-1;

        let insert_at = 0;

        while(low <= high){
            const mid = low + ((high - low) << 1);
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

                const niegh_price_str = arr[mid-1]?.p;
                assert(niegh_price_str !== undefined);
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

                const niegh_price_str = arr[mid+1]?.p;
                assert(niegh_price_str !== undefined);
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
}