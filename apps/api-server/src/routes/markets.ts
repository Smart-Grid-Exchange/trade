import Router from "koa-router";

const router = new Router({
    prefix: "/api/v1/markets"
});

router.get("/",(ctx,next) => {
    ctx.body = "Will contain all the markets present like day-ahead, hour-ahead etc."
    ctx.status = 200;
})

export default router.routes();