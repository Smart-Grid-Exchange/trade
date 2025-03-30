import * as v from "valibot";

export const worker_payload_schema = v.variant('TYPE',[
    v.object({
        TYPE: v.literal('EXECUTE'),
        DETAILS: v.object({
            client_id: v.number(),
            order_type: v.union([v.literal("MARKET"),v.literal("LIMIT")]),
            price: v.string(),
            quantity: v.string(),
            side: v.union([v.literal("BID"),v.literal("ASK")]),
            symbol: v.string(),
            time_in_force: v.string(),
        })
    })
])

export type WorkerPayload = v.InferOutput<typeof worker_payload_schema>;

export const order_schema = v.object({
    client_id: v.number(),
    p: v.string(),
    q: v.string(),
});

export type Order = v.InferOutput<typeof order_schema>;

export const side_schema = v.union([v.literal("BID"),v.literal("ASK")]);

export type Side = v.InferOutput<typeof side_schema>;

export const order_status = v.union([v.literal("FILLED"),v.literal("NOT_FILLED"),v.literal("PART_FILLED")]);

export type OrderStatus = v.InferOutput<typeof order_status>;