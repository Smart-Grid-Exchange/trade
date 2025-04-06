import Router from "koa-router";
import {Client} from "pg";
import * as v from "valibot";

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'mysecretpassword',
    port: 5432,
});

const router = new Router({
    prefix: "/api/v1/klines"
});

const query_params_schema = v.object({
    interval: v.union([v.literal("1w"),v.literal("1h"),v.literal("1m")]),
    start_time: v.number(),
    end_time: v.number(),
});

router.get("/",async (ctx) => {
    try{
        await client.connect();
        const parsed = v.safeParser(query_params_schema)(ctx.request.query);
        if(parsed.success === false){
            ctx.status = 400;
            ctx.body = {
                code: "INCORRECT_PARAMS",
                msg: 'REQUEST PARAMS WERE NOT ACCORDING TO SPECIFICATIONS'
            }
            return;
        }

        const {interval, start_time, end_time} = parsed.output;
        let query = `SELECT 
                        bucket, 
                        currency_code,
                        open AS first_price,
                        close AS last_price,
                        close - open AS price_change,
                        ((close - open) / open) * 100 AS price_change_percent,
                        high,
                        low,
                        volume,
                        volume * ((open + close) / 2) AS quote_volume,
                        COUNT(*) AS trades
                    `;
        const start_int = new Date(start_time).getTime() / 1000;
        const end_int = new Date(end_time).getTime() / 1000;

        switch(interval){
            case "1m": {
                query = `
                        ${query}
                        FROM klines_1m
                        WHERE bucket >= $1 AND bucket <= $2
                        ORDER BY bucket DESC;`
                break;
            }
            case "1h": {
                query = `
                        ${query}
                        FROM klines_1h
                        WHERE bucket >= $1 AND bucket <= $2
                        ORDER BY bucket DESC;`
                break;
            }
            case "1w": {
                query = `
                        ${query}
                        FROM klines_1w
                        WHERE bucket >= $1 AND bucket <= $2
                        ORDER BY bucket DESC;`
                break;
            }
            default: {
                ctx.status = 400;
                ctx.body = {
                    code: 'INVALID INTERVAL',
                    msg: 'WRONG INTERVAL PARAM SENT'
                }
                return;
            }
        }

        const resp = await client.query(query,[start_int.toString(),end_int.toString()]);

        ctx.status = 200;
        ctx.body = resp.rows;
        await client.end();
    }catch(err){
        ctx.status = 500;
        ctx.body = {
            code: 'INTERNAL_SERVER_ERR',
            msg: err
        }
    }
})