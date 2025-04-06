'use client'

import * as v from "valibot";
import { ws_depth_stream_schema } from "@/lib/types/depth";
import { SignalManager } from "@/util/signal"
import { useEffect } from "react"
import React,{ useState } from "react";
import { ws_trade_stream_schema } from "@/lib/types/trade";
import { Orderbook } from "./orderbook";
import PlaceOrder from "./place_order";

type WSDepthStream = v.InferOutput<typeof ws_depth_stream_schema>;

export default function Trade({params}: {params: Promise<{ market: string}>}){
    const {market} = React.use(params);
    const [bids,setBids] = useState<WSDepthStream["b"]>([]);
    const [asks,setAsks] = useState<WSDepthStream["a"]>([]);
    const [trades,setTrades] = useState<{p: string, q: string, t: string, id: number}[]>([]);

    function depth_stream_callback(raw_data: string){
        const data = v.parse(ws_depth_stream_schema,raw_data);
        const updated_asks = data.a.filter((a) => a[1] !== "0.00");
        const updated_afills = data.a.filter((a) => a[1] === "0.00").map((b) => b[0]);
        const updated_bids = data.b.filter((b) => b[1] !== "0.00");
        const updated_bfills = data.b.filter((b) => b[1] === "0.00").map((b) => b[0]);
        
        setBids((old_bids) => {
            const unfilled_old_bids = old_bids.filter((ob) => !updated_bfills.includes(ob[0]));
            const cumulative_bids: [string,string][] = unfilled_old_bids.map((unf_bid) => {
                const inc_bid = updated_bids.find((b) => b[0] === unf_bid[0]);
                let updated_quan = Number.parseFloat(unf_bid[1]);
                if(inc_bid !== undefined){
                    updated_quan =  Number.parseFloat(inc_bid[1]); 
                }

                return [unf_bid[0],updated_quan.toFixed(2)];
            });
            const new_bids = updated_bids.filter((up_bid) => !(unfilled_old_bids.map((unf_old) => unf_old[0])).includes(up_bid[0]))
            return [...cumulative_bids,...new_bids].sort((a,b) => Number.parseFloat(b[0]) - Number.parseFloat(a[0]));
        });

        setAsks((old_asks) => {
            const unfilled_old_asks = old_asks.filter((oa) => !updated_afills.includes(oa[0]));
            const cumulative_asks: [string,string][] = unfilled_old_asks.map((unf_ask) => {
                const inc_ask = updated_asks.find((a) => a[0] === unf_ask[0]);
                let updated_quan = Number.parseFloat(unf_ask[1]);
                if(inc_ask !== undefined){
                    updated_quan = Number.parseFloat(inc_ask[1]);
                }

                return [unf_ask[0],updated_quan.toFixed(2)]
            });
            const new_asks = updated_asks.filter((up_ask) => !(unfilled_old_asks.map((unf_old) => unf_old[0])).includes(up_ask[0]))
            return [...cumulative_asks,...new_asks].sort((a,b) => Number.parseFloat(b[0]) - Number.parseFloat(a[0]));
        });

    }

    function trade_stream_callback(raw_data: string){
        const data = v.parse(ws_trade_stream_schema,raw_data);
        setTrades((old_trades) => {
            const timestamp = new Date(data.E / 1000).toLocaleTimeString('en-us');
            return [{id: data.t, p: data.p, q: data.q, t: timestamp},...old_trades];
        })
    }
    useEffect(() => {
        // TODO: PASS USERNAME HERE
        SignalManager.get_instance("user_FOO").SUBSCRIBE([`trade@${market}`]);
        SignalManager.get_instance().SUBSCRIBE([`depth@${market}`]);
        SignalManager.get_instance().REGISTER_CALLBACK(`depth@${market}`,depth_stream_callback);
        SignalManager.get_instance().REGISTER_CALLBACK(`trade@${market}`,trade_stream_callback);
        

        return () => {
            // // TODO: PASS USERNAME HERE
            SignalManager.get_instance("user_FOO").UNSUBSCRIBE([`trade@${market}`]);
            SignalManager.get_instance().UNSUBSCRIBE([`depth@${market}`]);
            SignalManager.get_instance().DEREGISTER_CALLBACK(`depth@${market}`);
            SignalManager.get_instance().DEREGISTER_CALLBACK(`trade@${market}`);
        }
    },[market]);

    return(
        <div className="flex justify-end gap-2">
            <Orderbook bids={bids} asks={asks} trades={trades} price={trades.slice(-1)[0]?.p ?? ""}/>
            <PlaceOrder symbol={market} market_price={trades.slice(-1)[0]?.p ?? "100"}/>
        </div>
    )
}