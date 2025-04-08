import { selectorFamily } from "recoil";
import { fetch_tickers } from "./fetch_tickers";
import { Ticker } from "@/lib/types/market";

export const fetch_ticker = selectorFamily<Ticker | undefined, {market: string}>({
    key: "fetch_ticker",
    get: 
        ({market}:{market: string}) => 
            async({get}) => {
                try{
                    const all_tickers = get(fetch_tickers);
                    const search_ticker = all_tickers.find((t) => t.market === market);
                    return search_ticker;
                }catch(err){
                    console.log(err);
                    return undefined;
                }
            }
})