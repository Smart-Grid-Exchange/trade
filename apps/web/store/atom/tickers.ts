import { atom, atomFamily } from "recoil";
import { DashboardTickers, Ticker } from "@/lib/types/market";
import { fetch_tickers } from "../selector/fetch_tickers";
import { fetch_ticker } from "../selector/fetch_ticker";

export const tickers_state = atom<DashboardTickers>({
  key: "tickers",
  default: fetch_tickers,
});

export const ticker_state = atomFamily<Ticker | undefined, { market: string }>({
  key: "ticker_state",
  default: ({ market }: { market: string }) => fetch_ticker({ market }),
});
