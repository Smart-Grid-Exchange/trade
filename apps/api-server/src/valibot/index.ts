import * as v from "valibot";

export const order_side_schema = v.union([v.literal("BID"),v.literal("ASK")]);
export const order_execution_status_schema = v.union(
    [
        v.literal("CANCELLED"),
        v.literal("EXPIRED"),
        v.literal("FILLED"),
        v.literal("PART_FILLED"),
        v.literal("NEW")
    ]
);

export const engine_resp_schema = v.variant("TYPE", [
    v.object({
        TYPE: v.literal("EXECUTE_ORDER"),
        PAYLOAD: v.object({
            id: v.string(),
            status: order_execution_status_schema,
            executed_quan: v.number(),
            quan: v.string(),
            fills: v.array(
                v.object({
                    quan: v.number(),
                    price: v.string(),
                    trade_id: v.string(),
                })
            )
        })
    })
])