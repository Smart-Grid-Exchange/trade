import Router from "koa-router";
import {prisma} from "@repo/db";

const router = new Router({
    prefix: "/api/v1/markets"
});

router.get("/",async (ctx) => {
    try{
        const market = await prisma.market.findMany({
            where: {},
        });
        const mm = market.map((m) => {
            return {
                ...m,
                volume: m.volume.toString()
            }
        });
        ctx.body = mm;
        ctx.state = 200;
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