import * as v from "valibot";

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