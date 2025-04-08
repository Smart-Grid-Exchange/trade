import * as v from "valibot";

export const event_queue_popped_data_schema = v.variant("TYPE", [
  v.object({
    TYPE: v.literal("trade"),
    PAYLOAD: v.object({
      price: v.string(),
      quantity: v.string(),
      iso_timestamp: v.string(),
      symbol: v.string(),
    }),
  }),
]);

export type EventQueuePoppedData = v.InferOutput<
  typeof event_queue_popped_data_schema
>;
