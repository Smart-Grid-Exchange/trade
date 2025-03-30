import {createClient} from "redis";
import * as v from "valibot";
import { WorkerPayload, worker_payload_schema } from "./schema";
import { MARKETS } from "./const";
import { Engine } from "./engine";

const client = createClient();

async function main(){
    try{
        await client.connect();
        initialise_engine();
        while(true){
            try{
                const payload = await client.brPop("order",0);
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


async function initialise_engine(){
    MARKETS.forEach((market) => {
        try{
            Engine.get_instance().add_orderbook(market)
        }catch(err){
            console.log(err);
        }
    });

    console.log("Engine successfully initialised");
}

function process_queue(data: WorkerPayload){
    const TYPE = data.TYPE;
    
    switch(TYPE){
        case "EXECUTE": 
            const details = data.DETAILS;

            Engine.get_instance().process_order(details.symbol,details.side,{
                client_id: details.client_id,
                q: details.quantity,
                p: details.price,
            });
        break;
    }
}

main();