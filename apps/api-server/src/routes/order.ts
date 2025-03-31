import Router from "koa-router";
import * as v from "valibot";
import assert from "minimalistic-assert";
import { RedisManager } from "../redis_manager";
import { engine_resp_schema } from "../valibot";

const router = new Router({
    prefix: "/api/v1/order"
});

const execute_order_api_req_schema =  v.object({
    client_id: v.number(),
    order_type: v.union([v.literal("MARKET"),v.literal("LIMIT")]),
    price: v.string(),
    quantity: v.string(),
    quote_quantity: v.optional(v.string()),
    side: v.union([v.literal("BID"),v.literal("ASK")]),
    symbol: v.string(),
    time_in_force: v.union([v.literal("GTC"),v.literal("IOC"),v.literal("FOK")]),
})

router.post("/",async(ctx) => {
    try{
        const body = v.parse(execute_order_api_req_schema,ctx.request.body);
        // TODO: Fetch user_id from the ctx -- saved from the middleware
        const engine_payload = {
            user_id: "USER_",
            client_id: body.client_id,
            order_type: body.order_type,
            price: body.price,
            quantity: body.quantity,
            side: body.side,
            symbol: body.symbol,
            time_in_force: body.time_in_force
        }

        const created_at = Date.now();

        const raw_data = await RedisManager.get_instance()
        .send_and_await(body.client_id.toString(),JSON.stringify(engine_payload));

        const engine_resp = v.parse(engine_resp_schema,raw_data);

        assert(engine_resp.TYPE === "EXECUTE_ORDER");

        const engine_resp_data = engine_resp.PAYLOAD;

        if(engine_resp_data.status === "NEW"){
            ctx.body = {
                id: engine_resp_data.id
            }
            ctx.status = 202;
        }
        else if(engine_resp_data.status === "FILLED" || engine_resp_data.status === "PART_FILLED"){
            const resp_body = {
                client_id: body.client_id,
                id: engine_resp_data.id,
                created_at,
                executedQuantity: engine_resp_data.executed_quan,
                quantity: engine_resp_data.quan,
                side: body.side,
                symbol: body.symbol,
                status: engine_resp_data.status,
                time_in_force: body.time_in_force,
            };

            ctx.body = resp_body;
            ctx.status = 200;
        }
        else{
            ctx.body = {
                code: engine_resp_data.status,
            }
            ctx.status = 400;
        }
    }catch(err){
        ctx.status = 500;
        ctx.body = {
            code: 'INTERNAL_SERVER_ERROR',
            msg: 'PLEASE RETRY'
        }
    }
})

export default router.routes();