import { useEffect, useRef } from "react";
import { ChartManager } from "@/util/chart_manager";
import { klines_api_resp_schema } from "@/lib/types/trade";
import * as v from "valibot";

export default function TradeView({ market }: { market: string }) {
  const chart_ref = useRef<HTMLDivElement>(null);
  const chart_manager_ref = useRef<ChartManager>(null);

  useEffect(() => {
    console.log("hello");
    async function fetch_klines() {
      try {
        const query_params = new URLSearchParams({
          market: market,
          start_time: (
            new Date().getTime() -
            1000 * 60 * 60 * 24 * 7
          ).toString(),
          end_time: new Date().getTime().toString(),
          interval: "1m",
        });

        const resp = await fetch(
          `http://localhost:3001/api/v1/klines?` + query_params,
          {
            credentials: "include",
            headers: {
              "Content-type": "application/json",
            },
          },
        );

        const raw_data = await resp.json();
        if (resp.status === 200) {
          const data = v.parse(klines_api_resp_schema, raw_data);
          if (chart_ref && chart_ref.current) {
            if (chart_manager_ref.current) {
              chart_manager_ref.current.destroy();
            }
            const chart_manager = new ChartManager(chart_ref.current, data, {
              bg_color: "#f1f5f9",
              color: "#0f172a",
            });
            // @ts-expect-error this expects errror
            chart_manager_ref.current = chart_manager;
          }
        }
      } catch (err) {
        console.log(err);
        return [];
      }
    }

    fetch_klines();
  }, [chart_ref, market]);

  return (
    <div
      ref={chart_ref}
      style={{ height: "560px", width: "100%", marginTop: 4, borderRadius: 10 }}
    ></div>
  );
}
