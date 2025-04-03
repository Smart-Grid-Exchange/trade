import { RedisClientType, createClient } from "redis";

export class RedisManager{
    public static instance: RedisManager;
    private client: RedisClientType;
    
    private constructor(){
        this.client = createClient();
        this.client.connect();
    }

    public static get_instance(){
        if(!RedisManager.instance){
            RedisManager.instance = new RedisManager();
        }

        return RedisManager.instance;
    }

    public publish_to_event_queue(room_id: string,msg: string){
        this.client.publish(room_id,msg);
    }

    public publish_to_api(client_id: string, msg: string){
        this.client.publish(client_id, msg);
    }

    public push_to_db_queue(msg: string){
        this.client.lPush("DB",msg);
    }
}