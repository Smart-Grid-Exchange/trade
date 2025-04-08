import {ticker_ws_stream_schema } from "@/lib/types/trade";
import { SignalManager } from "@/util/signal";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import * as v from "valibot";
import { useRecoilValueLoadable } from "recoil";
import { fetch_ticker } from "@/store/selector/fetch_ticker";
import { Ticker } from "@/lib/types/market";

export default function Header({symbol,price}:{symbol: string,price: string}){
    const market = symbol.split("_")[0] ?? symbol;
    const [ticker,setTicker] = useState<Ticker>();
    const tickerState = useRecoilValueLoadable(fetch_ticker({market: market}));

    function ticker_ws_callback(raw_data: string){
        const data = v.parse(ticker_ws_stream_schema,raw_data);
        console.log((data));
    }

    useEffect(() => {
        SignalManager.get_instance().SUBSCRIBE([`ticker@${symbol}`]);
        SignalManager.get_instance().REGISTER_CALLBACK(`ticker@${symbol}`,ticker_ws_callback);
        return () => {
            SignalManager.get_instance().UNSUBSCRIBE([`ticker@${symbol}`])
            SignalManager.get_instance().DEREGISTER_CALLBACK(`ticker@${symbol}`);
        }
    },[symbol]);

    useEffect(() => {
        if(tickerState.state === "hasValue"){
            setTicker(tickerState.getValue());
        }
    },[tickerState])
    

    return (
    <Card className="p-0 w-full">
        {
            ticker !== undefined ? 
            <div className="flex items-center justify-between p-2 border-b rounded-md m-2 bg-slate-100">
                <div className="flex items-center p-2 bg-slate-300 rounded-md">
                    <span className="">{ticker.market}</span>
                    <span className="text-muted-foreground">/KWH</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xl">{price.length > 0 ? price : ticker.last_price}</span>
                    <span className="text-lg font-semibold">₹ {price.length > 0 ? price : ticker.last_price}</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-sm text-muted-foreground">
                    <span>24H Change</span>
                    </div>
                    <span className="">{ticker.price_change_percent.toFixed(2)}%</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">24H High</span>
                    <span>{ticker.high}</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">24H Low</span>
                    <span>{ticker.low}</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">24H Volume (KWH)</span>
                    <span>{ticker.volume}</span>
                </div>
        </div> : 
        <div>Loading...</div>
        }
    </Card>
    )
}