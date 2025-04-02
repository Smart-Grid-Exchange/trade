import Router from "koa-router";
import {prisma} from "@repo/db";

const router = new Router({
    prefix: "/api/v1/trades"
});

router.get("/",async(ctx) => {
    try{
        const symbol = ctx.params.symbol ?? "INR_KWH";
        const resp = await prisma.trade.findMany({
            where: {
                market: {
                    symbol
                }
            }
        });

        ctx.status = 200;
        ctx.body = resp;
    }catch(err){
        ctx.status = 400;
        ctx.body = {
            code: 'INTERNAL_SERVER_ERROR'
        }
    }
})

export default router.routes();