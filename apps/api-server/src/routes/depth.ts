import Router from "koa-router";
import * as v from "valibot";
import { RedisManager } from "../redis_manager";
import { engine_resp_schema } from "../valibot";
import assert from "minimalistic-assert";

const router = new Router({
    prefix: "/api/v1/depth"
});

router.get("/",async(ctx) => {
    const symbol = ctx.params.symbol ?? "INR_KWH";

    if(symbol === undefined){
        ctx.status = 400; 
        ctx.body = {
            code: "SYMBOL_ABSENT",
            msg: "SEND VALID SYMBOL"
        }
        return;
    }

    // TODO: Extract user_id from the cookie
    const user_id = "USER_FOO";
    const payload = {
        TYPE: "DEPTH",
        PAYLOAD: {
            symbol,
            user_id,
        }
    };

    const raw_data = await RedisManager.get_instance().send_and_await("USER_FOO",JSON.stringify(payload));

    const engine_resp = v.parse(engine_resp_schema,raw_data);
    assert(engine_resp.TYPE === "DEPTH");

    const engine_resp_data = engine_resp.PAYLOAD;

    ctx.status = 200;
    ctx.body = engine_resp_data;

})

export default router.routes();