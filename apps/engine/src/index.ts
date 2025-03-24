import {createClient} from "redis";
import * as v from "valibot";
import { worker_order_payload_schema } from "./schema";

const client = createClient();

async function main(){
    try{
        await client.connect();

        while(true){
            try{
                const payload = await client.brPop("order",0);
                if(payload == null)
                    continue;

                const raw_data = JSON.parse(payload.element);
                const data = v.parse(worker_order_payload_schema,raw_data);

                
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