import * as v from "valibot";

export const ticker_schema = v.object({
  market: v.string(),
  first_price: v.number(),
  last_price: v.number(),
  price_change: v.number(),
  price_change_percent: v.number(),
  high: v.number(),
  low: v.number(),
  volume: v.number(),
  quote_volume: v.number(),
  trades: v.string(),
});

export type Ticker = v.InferOutput<typeof ticker_schema>;
