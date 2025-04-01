import { WebSocketServer as WSSocketServer }from "ws";
import WebSocket from "ws";
import assert from "minimalistic-assert";
import { RedisSubscriptionManager } from "./redis_manager";

const WebSocketServer = WSSocketServer || WebSocket.Server;

const wss = new WebSocketServer({port: 8080}) ;

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
    method: 'JOIN',
    username: string,
} | {
    method: 'SUBSCRIBE' | 'UNSUBSCRIBE',
    username: string,
    params: string[]
}

async function init_ws_server(){
    
    wss.on("connection",async(ws)=>{
    
        const ws_id = client_count++;
        ws.on("message", async(raw_data)=>{
            const data:StreamPayload = JSON.parse(`${raw_data}`);
            const method = data.method;
            switch(method){
                case "JOIN": {
                    const username = data.username;
                    console.log(username + "joined");
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