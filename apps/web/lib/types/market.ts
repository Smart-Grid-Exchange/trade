import * as v from "valibot";

export const market_state_schema = v.union(
    [v.literal("OPEN"),v.literal("CLOSED"),v.literal("CANCEL_ONLY"),v.literal("LIMIT_ONLY")]
);

export const dashboard_markets_schema = v.array(
    v.object({
        id: v.number(),
        symbol: v.string(),
        volume: v.string(),
        price: v.string(),
        state: market_state_schema,
        created_at: v.optional(v.pipe(v.string(),v.transform((date) => new Date(date).toISOString()))),
        updated_at: v.optional(v.pipe(v.string(),v.transform((date) => new Date(date).toISOString()))),
    })
)

export type DashboardMarkets = v.InferOutput<typeof dashboard_markets_schema>;