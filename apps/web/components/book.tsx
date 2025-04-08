export default function Book({
  bids,
  asks,
  price,
  total_ask_max,
  total_bid_max,
}: {
  asks: [string, string, number][];
  bids: [string, string, number][];
  price?: string;
  total_ask_max: number;
  total_bid_max: number;
}) {
  return (
    <div className="w-full">
      <div>
        {asks.map((fill, i) => {
          return (
            <div
              key={i}
              style={{
                display: "flex",
                position: "relative",
                width: "100%",
                backgroundColor: "transparent",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${(100 * fill[2]) / total_ask_max}%`,
                  height: "100%",
                  background: "rgba(1, 167, 129, 0.325)",
                  transition: "width 0.3s ease-in-out",
                }}
              ></div>
              <div
                className={`flex justify-between text-xs w-full text-red-500 my-1`}
              >
                <div>{fill[0]}</div>
                <div>{fill[1]}</div>
                <div>{fill[2].toFixed(2)}</div>
              </div>
            </div>
          );
        })}
        <div
          className={
            total_ask_max > total_bid_max ? `text-red-600` : `text-green-600`
          }
        >
          {price ?? "NA"}
        </div>
        {bids.map((fill, i) => {
          return (
            <div
              key={i}
              style={{
                display: "flex",
                position: "relative",
                width: "100%",
                backgroundColor: "transparent",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${(100 * fill[2]) / total_bid_max}%`,
                  height: "100%",
                  background: "rgba(1, 167, 129, 0.325)",
                  transition: "width 0.3s ease-in-out",
                }}
              ></div>
              <div
                className={`flex justify-between text-xs w-full text-green-500 my-1`}
              >
                <div>{fill[0]}</div>
                <div>{fill[1]}</div>
                <div>{fill[2].toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
