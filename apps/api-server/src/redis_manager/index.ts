import type { RedisClientType } from "redis";
import {createClient} from "redis";


export class RedisManager{
    private static instance: RedisManager;
    private subscriber: RedisClientType;
    private publisher: RedisClientType;

    private constructor(){
        this.subscriber = createClient();
        this.subscriber.connect();
        this.publisher = createClient();
        this.publisher.connect();
    }

    public static get_instance(){
        if(!RedisManager.instance){
            RedisManager.instance = new RedisManager();
        }

        return RedisManager.instance;
    }

    public send_and_await(client_id_str: string,message: string){
        return new Promise<string>((resolve) => {
            this.subscriber.subscribe(client_id_str,(eng_resp) => {
                this.subscriber.unsubscribe(client_id_str);
                resolve(eng_resp);
            })
            this.publisher.lPush("ATE",message);
        })
    }
}