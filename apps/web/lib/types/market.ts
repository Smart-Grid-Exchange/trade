import * as v from "valibot";

export const market_state_schema = v.union(
    [v.literal("OPEN"),v.literal("CLOSED"),v.literal("CANCEL_ONLY"),v.literal("LIMIT_ONLY")]
);

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
})

export const dashboard_tickers_schema = v.array(
    ticker_schema
)

export type Ticker = v.InferOutput<typeof ticker_schema>;
export type DashboardTickers = v.InferOutput<typeof dashboard_tickers_schema>;