import { selector } from "recoil";
import { dashboard_tickers_schema } from "@/lib/types/market";
import type { DashboardTickers } from "@/lib/types/market";
import * as v from "valibot";

export const fetch_tickers = selector<DashboardTickers>({
  key: "fetch_tickers",
  get: async () => {
    try {
      const resp = await fetch(`https://exchangeapi.varuncodes.com/api/v1/tickers`, {
        credentials: "include",
      });
      const raw_data = await resp.json();
      const parsed = v.safeParser(dashboard_tickers_schema)(raw_data);
      if (parsed.success === false) {
        console.log(parsed.issues);
        return [];
      }

      return parsed.output;
    } catch (err) {
      console.log(err);
      return [];
    }
  },
});
