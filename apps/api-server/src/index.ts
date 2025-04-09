import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import cors from "@koa/cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config({path: path.resolve(__dirname,"../../../.env")});


import tradesRouter from "./routes/trades";
import tickerRouter from "./routes/tickers";
import orderRouter from "./routes/order";
import klinesRouter from "./routes/klines";
import depthRouter from "./routes/depth";

const HOST = process.env.API_HOST_PROD;
const PORT = 3001;

const app = new Koa();
app.use(bodyParser());

app.use(
  cors({
    origin: process.env.WEB_ORIGIN_PROD, // Allow Next.js frontend (update for production)
    credentials: true, // Allow cookies (if using authentication)
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowHeaders: ["Content-Type", "Authorization"], // Allowed headers
  }),
);

dotenv.config({path: path.resolve(__dirname,"../../../.env")});

app.use(tradesRouter);
app.use(tickerRouter);
app.use(orderRouter);
app.use(klinesRouter);
app.use(depthRouter);

app.listen(PORT, HOST, () => {
  console.log("Server start on port 3001");
});
