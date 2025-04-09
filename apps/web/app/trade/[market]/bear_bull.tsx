export default function BearBull({total_bid,total_ask}:{total_bid: number, total_ask: number}){
    return (
        <div
            className="w-full flex flex-row gap-1 px-1 my-1 text-center"
            // style={{
            //     display: "flex",
            //     width: "100%",
            //     backgroundColor: "transparent",
            // }}
            >
                <div
                    className="text-sm font-semibold"
                    style={{
                        width: `${((total_ask) / (total_ask + total_bid))*100}%`,
                        height: "100%",
                        background: "rgba(252 165 165)",
                        transition: "width 0.3s ease-in-out",
                    }}
                >
                    {((total_ask / (total_ask + total_bid))*100).toFixed(2)}%
                </div>
                <div
                    className="text-sm font-semibold"
                    style={{
                        width: `${((total_bid) / (total_ask + total_bid))*100}%`,
                        height: "100%",
                        background: "rgba(134 239 172)",
                        transition: "width 0.3s ease-in-out",
                    }}
                >
                    {((total_bid / (total_ask + total_bid))*100).toFixed(2)}%
                </div>
        </div>
    )
}