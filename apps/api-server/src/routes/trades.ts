import Router from "koa-router";

const router = new Router({
  prefix: "/api/v1/trades",
});

router.get("/:symbol", (ctx, next) => {
  ctx.body = "will contain latest orders for symbol" + ctx.params.symbol;
});

export default router.routes();
