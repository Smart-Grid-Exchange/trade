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


export const klines_api_resp_schema = v.array(
    v.object({
        bucket: v.string(),
        open: v.number(),
        close: v.number(),
        high: v.number(),
        low: v.number(),
        volume: v.number(),
        currency_code: v.string(),
    })
)

export type Klines = v.InferOutput<typeof klines_api_resp_schema>;


export const ticker_ws_stream_schema = v.object({
    e: v.literal("ticker"),
    E: v.number(),
    s: v.string(),
    o: v.number(),
    c: v.number(),
    h: v.number(),
    l: v.number(),
    V: v.number(),
    n: v.string(),
});


export type TickerWSStream = v.InferOutput<typeof ticker_ws_stream_schema>;

// {
//     "e": "ticker",          // Event type
//     "E": 1694687692980000,  // Event time in microseconds
//     "s": "SOL_USD",         // Symbol
//     "o": "18.75",           // First price
//     "c": "19.24",           // Last price
//     "h": "19.80",           // High price
//     "l": "18.50",           // Low price
//     "v": "32123",           // Base asset volume
//     "V": "928190",          // Quote asset volume
//     "n": 93828              // Number of trades
//   }

// E
// : 
// 1744054886335000
// V
// : 
// 6
// c
// : 
// 100
// e
// : 
// "ticker"
// h
// : 
// 103
// l
// : 
// 100
// n
// : 
// "4"
// o
// : 
// 103
// s
// : 
// "INR_KWH"
// v
// : 
// 610