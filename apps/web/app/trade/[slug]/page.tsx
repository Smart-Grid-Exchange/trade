"use client";

import { SwapUI } from "@/components/swap_ui";
import { Depth } from "@/components/depth/depth";


export default function Page({ params }: { params: { slug: string } }) {
    const market  = params.slug;
    return <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1">
            <div className="flex flex-row h-[920px] border-y border-slate-800">
                <div className="flex flex-col w-[250px] overflow-hidden">
                    <Depth market={market as string} /> 
                </div>
            </div>
        </div>
        <div className="w-[10px] flex-col border-slate-800 border-l"></div>
        <div>
            <div className="flex flex-col w-[250px]">
                {/* <SwapUI market={market as string} /> */}
            </div>
        </div>
    </div>
}