import Router from "koa-router";
import * as v from "valibot";
import assert from "minimalistic-assert";
import { RedisManager } from "../redis_manager";
import { engine_resp_schema } from "../valibot";

const router = new Router({
  prefix: "/api/v1/order",
});

const execute_order_api_req_schema = v.object({
  client_id: v.number(),
  order_type: v.union([v.literal("MARKET"), v.literal("LIMIT")]),
  price: v.string(),
  quantity: v.string(),
  quote_quantity: v.optional(v.string()),
  side: v.union([v.literal("BID"), v.literal("ASK")]),
  symbol: v.string(),
  time_in_force: v.union([
    v.literal("GTC"),
    v.literal("IOC"),
    v.literal("FOK"),
  ]),
});

const delete_order_api_req_schema = v.object({
  client_id: v.number(),
  id: v.string(),
  symbol: v.string(),
});

const get_open_order_api_req_schema = v.object({
  client_id: v.number(),
  id: v.string(),
  symbol: v.string(),
});

router.get("/", async (ctx) => {
  try {
    const raw_req_body = ctx.request.query;
    const parsed_req_body = v.safeParser(get_open_order_api_req_schema)(
      raw_req_body,
    );
    if (parsed_req_body.success === false) {
      ctx.body = {
        code: "INVALID_BODY_SCHEMA",
        msg: parsed_req_body.issues,
      };
      return;
    }

    // TODO: OBTAIN USER_ID FROM COOKIE
    const user_id = "USER_FOO";
    const req_body = parsed_req_body.output;
    const engine_payload = {
      TYPE: "OPEN_ORDER",
      PAYLOAD: {
        client_id: req_body.client_id,
        id: req_body.id,
        user_id,
        symbol: req_body.symbol,
      },
    };
    const raw_engine_resp = await RedisManager.get_instance().send_and_await(
      req_body.client_id.toString(),
      JSON.stringify(req_body),
    );

    const api_resp = v.parse(engine_resp_schema, raw_engine_resp);
    assert(api_resp.TYPE === "OPEN_ORDER");

    const api_resp_data = api_resp.PAYLOAD;
    if (api_resp_data === undefined) {
      ctx.status = 404;
      ctx.body = {
        code: "RESOURCE_NOT_FOUND",
        msg: "ORDER NOT FOUND",
      };
      return;
    }

    ctx.body = {
      client_id: req_body.client_id,
      ...api_resp_data,
    };
    ctx.status = 200;
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: "INTERNAL_SERVER_ERROR",
      msg: err,
    };
  }
});

router.post("/", async (ctx) => {
  try {
    const raw_req_body = ctx.request.body;
    console.log(raw_req_body);
    const parsed_req_body = v.safeParser(execute_order_api_req_schema)(
      raw_req_body,
    );
    if (parsed_req_body.success === false) {
      ctx.body = {
        code: "INVALID_BODY_SCHEMA",
        msg: parsed_req_body.issues,
      };
      return;
    }
    // TODO: Fetch user_id from the ctx -- saved from the middleware
    const body = parsed_req_body.output;
    const created_at = Date.now();
    const engine_payload = {
      TYPE: "EXECUTE",
      PAYLOAD: {
        user_id: "USER_FOO",
        client_id: body.client_id,
        order_type: body.order_type,
        price: body.price,
        quantity: body.quantity,
        side: body.side,
        symbol: body.symbol,
        created_at,
        time_in_force: body.time_in_force,
      },
    };

    const raw_data = await RedisManager.get_instance().send_and_await(
      body.client_id.toString(),
      JSON.stringify(engine_payload),
    );

    const engine_resp = v.parse(engine_resp_schema, raw_data);

    assert(engine_resp.TYPE === "EXECUTE_ORDER");

    const engine_resp_data = engine_resp.PAYLOAD;

    if (engine_resp_data === undefined) {
      ctx.status = 400;
      ctx.body = {
        code: "ORDER_NOT_PLACED",
        msg: "COULD NOT PLACE ORDER ON THE ORDERBOOK",
      };
      return;
    }

    if (engine_resp_data.status === "NEW") {
      ctx.body = {
        id: engine_resp_data.id,
        status: engine_resp_data.status,
      };
      ctx.status = 202;
    } else if (
      engine_resp_data.status === "FILLED" ||
      engine_resp_data.status === "PART_FILLED"
    ) {
      const resp_body = {
        client_id: body.client_id,
        id: engine_resp_data.id,
        created_at,
        executed_quantity: engine_resp_data.executed_quan,
        quantity: engine_resp_data.quan,
        fills: engine_resp_data.fills,
        side: body.side,
        symbol: body.symbol,
        status: engine_resp_data.status,
        time_in_force: body.time_in_force,
      };

      ctx.body = resp_body;
      ctx.status = 200;
    } else {
      ctx.body = {
        code: engine_resp_data.status,
      };
      ctx.status = 400;
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: "INTERNAL_SERVER_ERROR",
      msg: "PLEASE RETRY",
    };
  }
});

router.delete("/", async (ctx) => {
  try {
    const req_body = v.parse(delete_order_api_req_schema, ctx.request.body);

    // TODO: Fetch user_id from the cookies
    const engine_payload = {
      TYPE: "DELETE",
      PAYLOAD: {
        user_id: "USER_FOO",
        client_id: req_body.client_id,
        id: req_body.id,
        symbol: req_body.symbol,
      },
    };

    const raw_data = await RedisManager.get_instance().send_and_await(
      req_body.client_id.toString(),
      JSON.stringify(engine_payload),
    );

    const engine_resp = v.parse(engine_resp_schema, raw_data);
    assert(engine_resp.TYPE === "CANCEL_ORDER");

    const data = engine_resp.PAYLOAD;

    if (data === undefined) {
      ctx.status = 202;
      ctx.body = {
        code: "ORDER_NOT_FOUND",
        msg: "",
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      client_id: req_body.client_id,
      ...data,
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: "INTERNAL_SERVER_ERROR",
      msg: err,
    };
  }
});

export default router.routes();
