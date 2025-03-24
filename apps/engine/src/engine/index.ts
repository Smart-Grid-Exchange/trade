import { Orderbook } from "../orderbook";
import type { Order,Side } from "../schema";

type Market = string;

type BufferedMessage = {
    market: string,
    side: Side,
    order: Order,
}

export class Engine{
    private static instance: Engine;
    private orderbooks: Map<Market,Orderbook>;
    private buffered_orders: BufferedMessage[] =[];

    private constructor(){
        this.orderbooks = new Map();
    }

    public get_instance(){
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

        this.orderbooks.set(market, new Orderbook(market));
    }

    public get_orderbook(market: string){
        const orderbook = this.orderbooks.get(market);

        if(orderbook === undefined)
        {
            throw new Error(`Orderbook for market ${market} doesn't exists.`)
        }

        return orderbook;
    }

    public process_order(market: string, side: Side,order: Order){
        const orderbook = this.get_orderbook(market);

        if(orderbook.is_locked)
        {
            this.buffered_orders.push({market,side,order});
            return;
        }

        orderbook.process_order(side,order);
    }
}