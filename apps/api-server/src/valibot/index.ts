import * as v from "valibot";

export const order_side_schema = v.union([v.literal("BID"), v.literal("ASK")]);
export const order_execution_status_schema = v.union([
  v.literal("CANCELLED"),
  v.literal("EXPIRED"),
  v.literal("FILLED"),
  v.literal("PART_FILLED"),
  v.literal("NEW"),
]);

export const engine_resp_schema = v.variant("TYPE", [
  v.object({
    TYPE: v.literal("OPEN_ORDER"),
    PAYLOAD: v.optional(
      v.object({
        id: v.string(),
        created_at: v.string(),
        exec_quan: v.string(),
        quan: v.string(),
        side: order_side_schema,
        status: order_execution_status_schema,
        price: v.string(),
        symbol: v.string(),
      }),
    ),
  }),
  v.object({
    TYPE: v.literal("EXECUTE_ORDER"),
    PAYLOAD: v.optional(
      v.variant("status", [
        v.object({
          status: v.literal("NEW"),
          id: v.string(),
        }),
        v.object({
          status: v.union([v.literal("FILLED"), v.literal("PART_FILLED")]),
          id: v.string(),
          executed_quan: v.string(),
          quan: v.string(),
          fills: v.array(
            v.object({
              market_order_id: v.string(),
              quan: v.string(),
              price: v.string(),
              trade_id: v.number(),
            }),
          ),
        }),
      ]),
    ),
  }),
  v.object({
    TYPE: v.literal("CANCEL_ORDER"),
    PAYLOAD: v.optional(
      v.object({
        id: v.string(),
        symbol: v.string(),
        price: v.string(),
        quan: v.string(),
        exec_quan: v.string(),
        created_at: v.number(),
        side: order_side_schema,
      }),
    ),
  }),
  v.object({
    TYPE: v.literal("DEPTH"),
    PAYLOAD: v.object({
      bids: v.array(v.tuple([v.string(), v.string()])),
      asks: v.array(v.tuple([v.string(), v.string()])),
      last_update_id: v.string(),
      timestamp: v.number(),
    }),
  }),
]);
