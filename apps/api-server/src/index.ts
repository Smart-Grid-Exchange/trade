import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";

import tradesRouter from "./routes/trades";
import marketsRouter from "./routes/markets";
import orderRouter from "./routes/order";

const HOST = "localhost";
const PORT = 3001;

const app = new Koa();
app.use(bodyParser());

const router = new Router();

app.use(tradesRouter);
app.use(marketsRouter);
app.use(orderRouter);

app.listen(PORT,HOST, () => {
    console.log("Server start on port 3001");
})