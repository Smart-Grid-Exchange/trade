import {createClient} from "redis";
import * as v from "valibot";
import { WorkerPayload, worker_payload_schema } from "./schema";
import { Engine } from "./engine";

const client = createClient();

async function main(){
    try{
        await client.connect();
        Engine.get_instance().health_check();
        while(true){
            try{
                const payload = await client.brPop("ATE",0);
                if(payload == null)
                    continue;

                const raw_data = JSON.parse(payload.element);
                const data = v.parse(worker_payload_schema,raw_data);
                process_queue(data);
            }catch(err){
                console.log(err);
                console.log("Could not process queue");
                continue;
            }
        }
    }catch(err){
        console.log(err);
        console.log("Could not start worker.")
    }
}



function process_queue(data: WorkerPayload){
    const TYPE = data.TYPE;
    
    switch(TYPE){
        case "EXECUTE": 
        {
            const details = data.PAYLOAD;

            Engine.get_instance().process_order(details.user_id,details.symbol,details.side,{
                client_id: details.client_id,
                q: details.quantity,
                p: details.price,
                ca: details.created_at,
            });
            break;
        }
        case "CANCEL": 
        {
            const details = data.PAYLOAD;
            Engine.get_instance().cancel_order(details.user_id,details.symbol,{
                client_id: details.client_id,
                id: details.id
            });
            break;
        }
        case "DEPTH": 
        {
            const details = data.PAYLOAD;
            Engine.get_instance().get_depth(details.symbol,details.user_id);
            break;
        }
        case "OPEN_ORDER":{
            const details = data.PAYLOAD;
            Engine.get_instance().get_open_order(details.symbol,details.id,details.client_id);
        }
    }
}

main();