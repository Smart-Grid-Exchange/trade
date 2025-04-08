import assert from "minimalistic-assert";

import { createClient } from "redis";
import type { RedisClientType } from "redis";
import type WebSocket from "ws";

type Client = {
  ws: WebSocket;
  id: string;
  user_id: string;
};

export class RedisSubscriptionManager {
  private static instance: RedisSubscriptionManager;
  private subscriber: RedisClientType;
  private publisher: RedisClientType;
  // key: id value: room_id of all the rooms joined
  private subscriptions: Map<string, string[]>;
  // key: room_id value: all the clients joined to this room
  private reverse_subscription: Map<
    string,
    Record<
      string,
      {
        ws: WebSocket;
        id: string;
        user_id: string;
        color?: "black" | "white";
      }
    >
  >;

  private constructor() {
    this.subscriber = createClient();
    this.subscriber.connect();
    this.publisher = createClient();
    this.publisher.connect();
    this.subscriptions = new Map();
    this.reverse_subscription = new Map();
  }

  static get_instance(): RedisSubscriptionManager {
    if (!RedisSubscriptionManager.instance) {
      RedisSubscriptionManager.instance = new RedisSubscriptionManager();
    }

    return RedisSubscriptionManager.instance;
  }

  subscribe({ room_id, client }: { room_id: string; client: Client }) {
    // We "SUBSCRIBE" to the "CHANNEL" only once -- when the first member joins
    // for the later users we just "PUBLISH" to channel and the joined members/clients
    // are sent message using `reverse_subscription`
    const already_joined_room_ids = this.subscriptions.get(client.id) ?? [];

    this.subscriptions.set(client.id, [...already_joined_room_ids, room_id]);

    const clients_already_in_room =
      this.reverse_subscription.get(room_id) ?? {};

    this.reverse_subscription.set(room_id, {
      ...clients_already_in_room,
      [client.id]: {
        ws: client.ws,
        id: client.id,
        user_id: client.user_id,
      },
    });

    const room_size = this.get_room_size(room_id);

    if (room_size == 1) {
      this.subscriber.subscribe(room_id, (payload) => {
        const updated_clients_in_room = this.reverse_subscription.get(room_id);
        assert(
          updated_clients_in_room !== undefined,
          "Room should have one client at this point",
        );
        // this callback executes everytime message is "PUBLISHED" to channel
        // `room_id`
        try {
          Object.values(this.reverse_subscription.get(room_id) ?? {}).forEach(
            ({ ws, user_id }) => {
              ws.send(payload);
            },
          );
        } catch (err) {
          console.log(err);
        }
      });
    }
  }

  unsubscribe({ room_id, client }: { room_id: string; client: Client }) {
    if (this.subscriptions.has(client.id)) {
      const rooms_joined = this.subscriptions.get(client.id)!;
      const remaining_rooms = rooms_joined.filter((id) => room_id !== id);

      if (remaining_rooms.length == 0) this.subscriptions.delete(client.id);
      else this.subscriptions.set(client.id, remaining_rooms);
    }

    if (this.reverse_subscription.has(room_id)) {
      const clients_in_room = this.reverse_subscription.get(room_id)!;
      const left_client_id = client.id;

      delete clients_in_room[left_client_id];

      if (Object.keys(this.reverse_subscription.get(room_id)!).length === 0) {
        this.subscriber.unsubscribe(room_id);
        this.reverse_subscription.delete(room_id);
      }
    }
  }

  message({ room_id, payload }: { room_id: string; payload: string }) {
    this.publisher.publish(room_id, payload);
  }

  get_room_size(room_id: string) {
    return Object.keys(this.reverse_subscription.get(room_id) ?? {}).length;
  }

  get_room_members(room_id: string) {
    const clients = this.reverse_subscription.get(room_id) ?? {};
    const members = Object.values(clients).map((client) => ({
      user_id: client.user_id,
      color: client.color,
    }));

    return members;
  }
}
