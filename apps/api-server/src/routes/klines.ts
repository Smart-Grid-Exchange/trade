import Router from "koa-router";
import { Client } from "pg";
import * as v from "valibot";
import path from "path";
import dotenv from "dotenv";

dotenv.config({path: path.resolve(__dirname,"../../../.env")});

const client = new Client({
  user: process.env.DB_USER_PROD,
  host: process.env.DB_HOST_PROD,
  database: process.env.DB_DATABASE_PROD,
  password: process.env.DB_PASSWORD_PROD,
  port: Number.parseInt(process.env.DB_PORT_PROD ?? "5432"),
});

client.connect();

const router = new Router({
  prefix: "/api/v1/klines",
});

const query_params_schema = v.object({
  interval: v.union([v.literal("1w"), v.literal("1h"), v.literal("1m")]),
  start_time: v.string(),
  end_time: v.string(),
  market: v.string(),
});

router.get("/", async (ctx) => {
  try {
    const parsed = v.safeParser(query_params_schema)(ctx.request.query);
    if (parsed.success === false) {
      ctx.status = 400;
      ctx.body = {
        code: "INCORRECT_PARAMS",
        msg: "REQUEST PARAMS WERE NOT ACCORDING TO SPECIFICATIONS",
      };
      return;
    }

    const { interval, start_time, end_time, market } = parsed.output;
    let table_name;

    const start_int = new Date(Number.parseInt(start_time)).toUTCString();
    const end_int = new Date(Number.parseInt(end_time)).toUTCString();
    const currency_code = market.split("_")[0]!;
    switch (interval) {
      case "1m": {
        table_name = `klines_1m`;
        break;
      }
      case "1h": {
        table_name = `klines_1h`;
        break;
      }
      case "1w": {
        table_name = `klines_1w`;
        break;
      }
      default: {
        ctx.status = 400;
        ctx.body = {
          code: "INVALID INTERVAL",
          msg: "WRONG INTERVAL PARAM SENT",
        };
        return;
      }
    }
    let query = `SELECT * FROM ${table_name} WHERE bucket >= $1 AND bucket <= $2 AND currency_code = $3`;

    try {
      const resp = await client.query(query, [
        start_int,
        end_int,
        currency_code,
      ]);

      ctx.status = 200;
      ctx.body = resp.rows;
    } catch (err) {
      console.log(err);
      ctx.status = 200;
      ctx.body = {
        code: "COULD NOT FETCH DB",
        msg: err,
      };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: "INTERNAL_SERVER_ERR",
      msg: err,
    };
  }
});

export default router.routes();
