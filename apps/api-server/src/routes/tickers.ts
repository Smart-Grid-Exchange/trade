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
client.connect();
const router = new Router({
    prefix: "/api/v1/tickers"
});

const query_params_schema = v.object({
    interval: v.union([v.literal("1w"),v.literal("1h"),v.literal("1m")]),
})

router.get("/",async (ctx) => {
    try{
        
        const parsed = v.safeParser(query_params_schema)(ctx.request.query);
        let interval = `1 week`;
        if(parsed.success){
            switch(parsed.output.interval){
                case "1w": {
                    interval = '1 week'
                    break;
                }
                case "1h": {
                    interval = '1 hour'
                    break;
                }
                case "1m": {
                    interval = '1 minute'
                    break;
                }
            }
        }
        const resp = await client.query(`
            SELECT 
                currency_code as market,
                first(price, time) AS first_price,
                last(price, time) AS last_price,
                last(price, time) - first(price, time) AS price_change,
                ((last(price, time) - first(price, time)) / first(price, time)) * 100 AS price_change_percent,
                max(price) AS high,
                min(price) AS low,
                sum(volume) AS volume,
                sum(volume * price) AS quote_volume,
                COUNT(*) AS trades
            FROM kwh_price
            WHERE time >= NOW() - INTERVAL '${interval}'
            GROUP BY currency_code
            ORDER BY MAX(time) DESC
            LIMIT 1;
        `);

        ctx.status = 200;
        ctx.body = resp.rows;
        
    }catch(err){
        console.log(err);
        ctx.status = 500;
        ctx.body = {
            code: "INTERNAL_SERVER_CODE",
            body: "FAILED FETCHING MARKETS, TRY AGAIN",
        }
    }
})

export default router.routes();

