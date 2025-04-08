import { atomFamily } from "recoil";
import { DepthApiResp, fetch_depth } from "../selector/fetch_depth";

export const depth_state = atomFamily<
  DepthApiResp | undefined,
  { symbol: string }
>({
  key: "depthState",
  default: ({ symbol }: { symbol: string }) => fetch_depth({ symbol }),
});
