'use server'

import { MarketTable } from "@/components/markets";
import { dashboard_markets_schema } from "@/lib/types/market";
import * as v from "valibot";

async function get_markets(){
  try{
    const resp = await fetch("http://localhost:3001/api/v1/tickers",{
      credentials: "include"
    });
    const raw_data = await resp.json();
    const parsed = v.safeParser(dashboard_markets_schema)(raw_data);
    if(parsed.success){
      return parsed.output;
    }
    console.log(parsed.issues)
    return [];
  }catch(err){
    console.log(err);
    return undefined;
  }
}

export default async function Home(){
  const markets = await get_markets();
  return(
    <div>
      {
      markets !== undefined ? 
      <div className="flex">
        <MarketTable markets={markets}/>
      </div> : 
      <div>hello</div>
      }
    </div>
  )
}