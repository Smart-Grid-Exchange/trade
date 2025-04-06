import * as v from "valibot";

export const ws_trade_stream_schema = v.object({
    e: v.string(),
    E: v.number(),
    s: v.string(),
    p: v.string(),
    q: v.string(),
    b: v.string(),
    a: v.string(),
    t: v.number(),
    T: v.number(),
    m: v.optional(v.boolean()), // is buyers a maker -- not implemented rn.
});


export const trade_form_schema = v.variant("order_type",[
    v.object({
        order_type: v.literal("MARKET"),
        price: v.string(),
        quantity: v.string(),
        quote_quantity: v.string(),
        side: v.union([v.literal("BID"),v.literal("ASK")]),
        symbol: v.string(),
        
    }),
    v.object({
        order_type: v.literal("LIMIT"),
        price: v.string(),
        quantity: v.string(),
        side: v.union([v.literal("BID"),v.literal("ASK")]),
        symbol: v.string(),
        time_in_force: v.union([v.literal("GTC"),v.literal("IOC"),v.literal("FOK")]),
    })
])

