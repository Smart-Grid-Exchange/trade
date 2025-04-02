import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";


import tradesRouter from "./routes/trades";
import marketsRouter from "./routes/markets";
import orderRouter from "./routes/order";
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
    })
  );


app.use(tradesRouter);
app.use(marketsRouter);
app.use(orderRouter);
app.use(depthRouter);

app.listen(PORT,HOST, () => {
    console.log("Server start on port 3001");
})