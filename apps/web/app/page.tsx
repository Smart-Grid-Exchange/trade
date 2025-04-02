"use client";

import { VaultTable } from "@/components/market_table";
import { useLayoutEffect, useState } from "react";

type Market = {
  symbol: string;
  id: number;
  price: number;
  state: string;
  createdAt: string;
  updatedAt: Date;
  volume: string;
}

export default function Home() {

  const [markets,setMarkets] = useState<Market[]>([]);

  useLayoutEffect(() => {
    const get_markets = async() => {
      try{
        const resp = await fetch("http://localhost:3001/api/v1/markets",{
          credentials: "include"
        });
        const body = await resp.json();

        setMarkets(body);
      }catch(err){
        console.log(err);
      }
    }

    get_markets();
  }, [])

  return (
    <div>
      <div className="mt-6 mx-6">
            <VaultTable vaults={markets}/>
        </div>
    </div>
  );
}