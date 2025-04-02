"use client";

import { useEffect, useState } from "react";
import { getDepth, get_market } from "@/lib/http_client";
import { BidTable } from "./bid_table";
import { AskTable } from "./ask_table";

export function Depth({ market }: {market: string}) {
    const [bids, setBids] = useState<[string, string][]>([]);
    const [asks, setAsks] = useState<[string, string][]>();
    const [price, setPrice] = useState<string>();

    // useEffect(() => {
    //     SignalingManager.getInstance().registerCallback("depth", (data: any) => {
    //         console.log("depth has been updated");
    //         console.log(data);
            
    //         setBids((originalBids) => {
    //             const bidsAfterUpdate = [...(originalBids || [])];

    //             for (let i = 0; i < bidsAfterUpdate.length; i++) {
    //                 for (let j = 0; j < data.bids.length; j++)  {
    //                     if (bidsAfterUpdate[i][0] === data.bids[j][0]) {
    //                         bidsAfterUpdate[i][1] = data.bids[j][1];
    //                         if (Number(bidsAfterUpdate[i][1]) === 0) {
    //                             bidsAfterUpdate.splice(i, 1);
    //                         }
    //                         break;
    //                     }
    //                 }
    //             }

    //             for (let j = 0; j < data.bids.length; j++)  {
    //                 if (Number(data.bids[j][1]) !== 0 && !bidsAfterUpdate.map(x => x[0]).includes(data.bids[j][0])) {
    //                     bidsAfterUpdate.push(data.bids[j]);
    //                     break;
    //                 }
    //             }
    //             bidsAfterUpdate.sort((x, y) => Number(y[0]) > Number(x[0]) ? -1 : 1);
    //             return bidsAfterUpdate; 
    //         });

    //         setAsks((originalAsks) => {
    //             const asksAfterUpdate = [...(originalAsks || [])];

    //             for (let i = 0; i < asksAfterUpdate.length; i++) {
    //                 for (let j = 0; j < data.asks.length; j++)  {
    //                     if (asksAfterUpdate[i][0] === data.asks[j][0]) {
    //                         asksAfterUpdate[i][1] = data.asks[j][1];
    //                         if (Number(asksAfterUpdate[i][1]) === 0) {
    //                             asksAfterUpdate.splice(i, 1);
    //                         }
    //                         break;
    //                     }
    //                 }
    //             }

    //             for (let j = 0; j < data.asks.length; j++)  {
    //                 if (Number(data.asks[j][1]) !== 0 && !asksAfterUpdate.map(x => x[0]).includes(data.asks[j][0])) {
    //                     asksAfterUpdate.push(data.asks[j]);
    //                     break;
    //                 }
    //             }
    //             asksAfterUpdate.sort((x, y) => Number(y[0]) > Number(x[0]) ? 1 : -1);
    //             return asksAfterUpdate; 
    //         });
    //     }, `DEPTH-${market}`);
        
    //     SignalingManager.getInstance().sendMessage({"method":"SUBSCRIBE","params":[`depth@${market}`],"user_id": "USER_FOO"});

    //     getDepth(market).then(d => {    
    //         setBids(d.bids.reverse());
    //         setAsks(d.asks);
    //     });

    //     getTrades(market).then(t => setPrice((t[0]?.price ?? 15.5).toString()));

    //     return () => {
    //         SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`depth@${market}`],"user_id": "USER_FOO"});
    //         SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
    //     }
    // }, [])

    useEffect(() => {
        setTimeout(async() => {
            const resp = await getDepth(market);
            const m = await get_market(market);
            setBids(resp.bids.sort((a,b) => Number.parseFloat(a[0]) - Number.parseFloat(b[0]) ).reverse());
            setAsks(resp.asks.sort((a,b) => Number.parseFloat(a[0]) - Number.parseFloat(b[0]) ).reverse());
            setPrice((resp.market_price ?? 120.00).toString());
        },5000)
    })
    
    return <div>
        <TableHeader />
        {asks && <AskTable asks={asks} />}
        {price && <div>{price}</div>}
        {bids && <BidTable bids={bids} />}
    </div>
}

function TableHeader() {
    return <div className="flex justify-between text-xs">
    <div className="text-white">Price</div>
    <div className="text-slate-500">Size</div>
    <div className="text-slate-500">Total</div>
</div>
}