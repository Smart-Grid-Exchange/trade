'use client'

import { MarketTable } from "@/components/markets";
import { tickers_state } from "@/store/atom/tickers";
import { useRecoilValueLoadable } from "recoil";

export default function Home(){
  const tickersState = useRecoilValueLoadable(tickers_state);
  return(
    <div>
      {
      tickersState.state === "hasValue" ? 
      <div className="flex">
        <MarketTable tickers={tickersState.getValue()}/>
      </div> : 
      <div>Loading</div>
      }
    </div>
  )
}