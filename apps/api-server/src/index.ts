import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import cors from "@koa/cors";

import tradesRouter from "./routes/trades";
import tickerRouter from "./routes/tickers";
import orderRouter from "./routes/order";
import klinesRouter from "./routes/klines";
import depthRouter from "./routes/depth";

const HOST = "localhost";
const PORT = 3001;

const app = new Koa();
app.use(bodyParser());

app.use(
  cors({
    origin: "http://localhost:3000", // Allow Next.js frontend (update for production)
    credentials: true, // Allow cookies (if using authentication)
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowHeaders: ["Content-Type", "Authorization"], // Allowed headers
  }),
);

const router = new Router();

app.use(tradesRouter);
app.use(tickerRouter);
app.use(orderRouter);
app.use(klinesRouter);
app.use(depthRouter);

app.listen(PORT, HOST, () => {
  console.log("Server start on port 3001");
});
