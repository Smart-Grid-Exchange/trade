import { WebSocketServer as WSSocketServer }from "ws";
import WebSocket from "ws";
import { Client } from "pg";
import { RedisSubscriptionManager } from "./redis_manager";
import { Ticker } from "./types";

const WebSocketServer = WSSocketServer || WebSocket.Server;

const wss = new WebSocketServer({port: 8080}) ;

const db_client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'mysecretpassword',
    port: 5432,
});

db_client.connect();

type WsClients = Record<number, {
    ws: WebSocket,
    room_id: string,
    user_id: string
}>;

export const online_clients: Record<number, {
    ws: WebSocket,
    username: string,
}> = {};
let client_count = 0;


type StreamPayload = {
    method: 'CONNECT',
    username: string,
} | {
    method: 'SUBSCRIBE' | 'UNSUBSCRIBE',
    username: string,
    params: string[]
}

async function init_ws_server(){
    // start streaming tickers etc as soon as ws server starts
    start_streams();
    wss.on("connection",async(ws)=>{
    
        const ws_id = client_count++;
        ws.on("message", async(raw_data)=>{
            const data:StreamPayload = JSON.parse(`${raw_data}`);
            const method = data.method;
            switch(method){
                case "CONNECT": {
                    const username = data.username;
                    online_clients[ws_id] = {
                        ws,
                        username,
                    };
                    break;
                }
                case "SUBSCRIBE": {
                    const streams = data.params;
                    streams.forEach((s) => {
                        RedisSubscriptionManager.get_instance().subscribe({
                            room_id: s,
                            client: {
                                user_id: data.username,
                                ws: ws,
                                id: ws_id.toString(),
                            }
                        })
                    });
                    break;
                }
                case "UNSUBSCRIBE": {
                    const streams = data.params;
                    streams.forEach((s) => {
                        RedisSubscriptionManager.get_instance().unsubscribe({
                            room_id: s,
                            client: {
                                user_id: data.username,
                                ws: ws,
                                id: ws_id.toString()
                            }
                        })
                    })
                    break;
                }
                
            }
        })
        ws.on("close",()=>{
            if(online_clients[ws_id]){
                console.log(online_clients[ws_id]?.username + "just went offline");
                delete online_clients[ws_id];
            }
        })
    })
}

init_ws_server();

function start_streams(){
    setInterval(() => {
        stream_tickers();
    },1000 * 10)
}


async function stream_tickers(){
    try{
        console.log("STREAMING TICKERS")
        const interval = '1 hour';
        const resp = await db_client.query(`
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

        resp.rows.map((t:Ticker) => {
            const msg = JSON.stringify({
                stream: `ticker@${t.market}_KWH`,
                data: {
                    e: "ticker",
                    E: new Date().getTime() * 1000,
                    s: `${t.market}_KWH`,
                    o: t.first_price,
                    c: t.last_price,
                    h: t.high,
                    l: t.low,
                    v: t.quote_volume,
                    V: t.volume,
                    n: t.trades,
                }
            })
            RedisSubscriptionManager.get_instance().message({
                room_id: `ticker@${t.market}_KWH`,
                payload: msg,
            });
        })
    }catch(err){
        console.log(err);
        console.log("COULD NOT STREAM TICKERS")
    }
}


