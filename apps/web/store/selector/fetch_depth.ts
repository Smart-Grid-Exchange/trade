import { selectorFamily } from "recoil";
import * as v from "valibot";

export const depth_api_resp_schema = v.object({
  last_update_id: v.string(),
  timestamp: v.number(),
  bids: v.array(v.tuple([v.string(), v.string()])),
  asks: v.array(v.tuple([v.string(), v.string()])),
});

export type DepthApiResp = v.InferOutput<typeof depth_api_resp_schema>;

export const fetch_depth = selectorFamily<
  DepthApiResp | undefined,
  { symbol: string }
>({
  key: "fetch_depth",
  get:
    ({ symbol }: { symbol: string }) =>
    async () => {
      try {
        const query_param = new URLSearchParams({
          symbol,
        });
        const resp = await fetch(
          "http://localhost:3001/api/v1/depth?" + query_param,
          {
            credentials: "include",
            headers: {
              "Content-type": "application/json",
            },
          },
        );
        if (resp.status === 200) {
          const raw_data = await resp.json();
          const data = v.parse(depth_api_resp_schema, raw_data);
          return data;
        }

        return undefined;
      } catch (err) {
        console.log(err);
        return undefined;
      }
    },
});
