import { Orderbook } from "../orderbook";
import type { Order,Side } from "../schema";
import type { Buffer } from "../schema";

type Market = string;

export class Engine{
    private static instance: Engine;
    private orderbooks: Map<Market,Orderbook>;
    private buffered_orders: Buffer =[];

    private constructor(){
        this.orderbooks = new Map();
    }

    public static get_instance(){
        if(!Engine.instance)
        {
            Engine.instance = new Engine();
        }

        return Engine.instance;
    }

    public add_orderbook(market: string){
        if(this.orderbooks.get(market) !== undefined)
        {
            throw new Error(`Orderbook already exists for ${market} market`);
        }
        // TODO: FETCH LAST ORDER
        const last_order_count = -1;
        this.orderbooks.set(market, new Orderbook(market,1 + last_order_count));
    }

    public get_orderbook(market: string){
        const orderbook = this.orderbooks.get(market);

        if(orderbook === undefined)
        {
            throw new Error(`Orderbook for market ${market} doesn't exists.`)
        }

        return orderbook;
    }

    public process_order(user_id: string,market: string, side: Side,order: Omit<Order,"id">){
        const orderbook = this.get_orderbook(market);

        const order_id = this.assign_order_id(user_id,orderbook.market,orderbook.new_order_count);

        if(orderbook.is_locked)
        {
            this.buffered_orders.push({ACTION: "EXECUTE", DETAILS: {
                user_id,
                market,
                side,
                order: {
                    q: order.q,
                    p: order.p,
                    id: order_id
                }
            }});
            return;
        }
        orderbook.lock_orderbook();
        orderbook.process_order(
            side,
            {
                q: order.q,
                p: order.p,
                id: order_id
            }
        );
        // TODO: Process buffered orders before opening the lock again.
        orderbook.unlock_orderbook();
    }

    public cancel_order(user_id: string,market: string,order_id: string){
        const orderbook = this.get_orderbook(market); 

        if(orderbook.is_locked){
            this.buffered_orders.push({
                ACTION: "CANCEL",
                DETAILS: {
                    user_id,
                    market: market,
                    id: order_id
                }
            })
        }

        try{
            orderbook.cancel_order(order_id);
        }catch(err){
            console.log(err);
        }
    }

    // PRIVATE METHODS

    private assign_order_id(user_id: string,market: string,new_order_count: number){
        return `${user_id}-SYB_${market}-ORD_${new_order_count}`;
    }
}