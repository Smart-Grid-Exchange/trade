import * as v from "valibot";

export const worker_payload_schema = v.variant('TYPE',[
    v.object({
        TYPE: v.literal('EXECUTE'),
        PAYLOAD: v.object({
            user_id: v.string(),
            client_id: v.number(),
            order_type: v.union([v.literal("MARKET"),v.literal("LIMIT")]),
            price: v.string(),
            quantity: v.string(),
            side: v.union([v.literal("BID"),v.literal("ASK")]),
            symbol: v.string(),
            created_at: v.number(),
            time_in_force: v.union([v.literal("GTC"),v.literal("IOC"),v.literal("FOK")]),
        })
    }),
    v.object({
        TYPE: v.literal("CANCEL"),
        PAYLOAD: v.object({
            user_id: v.string(),
            client_id: v.number(),
            id: v.string(),
            symbol: v.string(),
        })
    }),
    v.object({
        TYPE: v.literal("DEPTH"),
        PAYLOAD: v.object({
            user_id: v.string(),
            symbol: v.string()
        })
    }),
    v.object({
        TYPE: v.literal("OPEN_ORDER"),
        PAYLOAD: v.object({
            client_id: v.number(),
            id: v.string(),
            user_id: v.string(),
            symbol: v.string(),
        })
    })
])

export type WorkerPayload = v.InferOutput<typeof worker_payload_schema>;

export const side_schema = v.union([v.literal("BID"),v.literal("ASK")]);

export const order_schema = v.object({
    id: v.string(),
    p: v.string(),
    q: v.string(),
    eq: v.string(),
    ca: v.number(),
    s: side_schema
});

export type Order = v.InferOutput<typeof order_schema>;

export type OrderRequest = Omit<Order, "eq" | "s">;

export type Side = v.InferOutput<typeof side_schema>;

export const order_status = v.union([v.literal("FILLED"),v.literal("NOT_FILLED"),v.literal("PART_FILLED")]);

export type OrderStatus = v.InferOutput<typeof order_status>;


export const buffer = v.array(v.variant('ACTION', [
    v.object({
        ACTION: v.literal("EXECUTE"),
        DETAILS: v.object({
            user_id: v.string(),
            market: v.string(),
            side: side_schema,
            order: v.omit(order_schema, ["eq","ca"])
        })
    }),
    v.object({
        ACTION: v.literal("CANCEL"),
        DETAILS: v.object({
            user_id: v.string(),
            market: v.string(),
            id: v.string(),
        })
    })
]));

export type Buffer = v.InferOutput<typeof buffer>;

export const order_fill_schema = v.object({
    price: v.string(),
    quan: v.string(),
    trade_id: v.number(),
    market_order_id: v.string(),
});

export type OrderFill = v.InferOutput<typeof order_fill_schema>;

export const orderbook_state = v.object({
    market: v.string(),
    last_trade_id: v.number(),
    asks: v.array(v.tuple([v.string(),v.string()])),
    bids: v.array(v.tuple([v.string(),v.string()])),
    market_price: v.string(),
});

export const orderbook_snapshot = v.object({
    orderbooks: v.array(orderbook_state)
})


export type OrderbookSnapshot = v.InferOutput<typeof orderbook_state>;

export const ws_depth_stream_schema = v.object({
    e: v.string(),
    E: v.number(),
    s: v.string(),
    a: v.array(v.tuple([v.string(),v.string()])),
    b: v.array(v.tuple([v.string(),v.string()])),
    U: v.number(),
    u: v.number(),
    T: v.number(),
});

export type WSDepthStream = v.InferOutput<typeof ws_depth_stream_schema>;

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

export type WSTradeStream = v.InferOutput<typeof ws_trade_stream_schema>;