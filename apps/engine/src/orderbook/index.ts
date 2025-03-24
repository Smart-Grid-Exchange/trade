import assert from "minimalistic-assert";
import type { Order, Side } from "../schema";

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
        this.is_locked = true;

        if(side === 'ASK'){
            if(this.bids.length === 0){
                this.place_ask(order);
                return;
            }

            // let price = this.bids[0]?.p;

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

            
        }
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