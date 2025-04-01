import Router from "koa-router";
import * as v from "valibot";
import { RedisManager } from "../redis_manager";

const router = new Router({
    prefix: "/api/v1/depth"
});



router.get("/:symbol",async(ctx) => {
    const symbol = ctx.params.symbol;

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
        DETAILS: {
            symbol,
            user_id,
        }
    };

    const resp = await RedisManager.get_instance().send_and_await("USER_FOO",JSON.stringify(payload));
})