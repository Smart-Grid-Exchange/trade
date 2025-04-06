import assert from "minimalistic-assert";

const PORT = 8080;
const BASE_URL = "ws://localhost"
export class SignalManager{
    private static instance: SignalManager;
    private ws: WebSocket;
    private initialised: boolean = false;
    private buffered_messages: {
        event_id: number,
        payload: string,
    }[] = [];
    private callbacks: Map<string,(data: string) => void> = new Map();;
    private event_id: number;
    private backoff_interval: number = 1000; 
    private username: string;

    private constructor(username: string){
        this.ws = new WebSocket(`${BASE_URL}:${PORT}`);
        this.event_id = 0;
        this.username = username;
        this.init_ws();
    }

    private init_ws(){
        this.ws.onopen = () => {
            this.initialised = true;
            this.ws.send(JSON.stringify({
                method: 'CONNECT',
                username: this.username,
            }));
            this.buffered_messages.map((msg) => {
                this.ws.send(msg.payload);
            });
            console.log("CONNECTED TO WS SERVER");
            this.start_heartbeats();
        }

        this.ws.onmessage = (event) => {
            const raw_payload = event.data;
            const payload = JSON.parse(raw_payload);
            // TODO: TYPE THIS AND PARSE THIS FULLY
            const stream = payload.stream;
            const data = payload.data;

            const target_stream = this.callbacks.has(stream);

            if(target_stream === true){
                const registered_callback = this.callbacks.get(stream)!;
                registered_callback(data);
            }
        }

        this.ws.onclose = (event) => {
            // @ts-expect-error We are tryping to delete a field ie. non optional -- FIX THIS
            delete SignalManager.instance;
            this.initialised = false;

            if(event.wasClean === false){
                setInterval(() => {
                    SignalManager.get_instance();
                },this.backoff_interval)
            }
        }
    }

    public static get_instance(username?: string){
        if(SignalManager.instance === undefined){
            assert(username !== undefined, "Caller must pass username during singleton initialisation");
            SignalManager.instance = new SignalManager(username);
        }

        return SignalManager.instance;
    }

    public SUBSCRIBE(params: string[]){
        const payload = {
            method: 'SUBSCRIBE',
            params,
        };

        this.handle_msg(JSON.stringify(payload));
    }

    public UNSUBSCRIBE(params: string[]){
        const payload = {
            method: 'UNSUBSCRIBE',
            params
        };

        this.handle_msg(JSON.stringify(payload));
    }

    public REGISTER_CALLBACK(param: string, callback: (data: string) => void){
        this.callbacks.set(param, callback);
    }

    public DEREGISTER_CALLBACK(param: string){
        if(this.callbacks.has(param)){
            this.callbacks.delete(param);
        }
    }

    // -------------- PRIVATE MEMBER FUNCTION --------------

    private handle_msg(payload: string){
        if(this.initialised === false){
            this.buffered_messages.push({
                event_id: this.event_id++,
                payload: payload
            });
            return;
        }

        this.ws.send(payload);
    }

    private start_heartbeats(){
        const payload = JSON.stringify({
            method: "LUBB",
            stamp: Date.now(),
        });
        setInterval(() => {
            this.handle_msg(payload);
        },30 * 1000);
    }
}