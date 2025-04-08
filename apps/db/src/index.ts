import * as v from "valibot";
import { Client } from "pg";
import { createClient } from "redis";

import { event_queue_popped_data_schema } from "./schema";
import type { EventQueuePoppedData } from "./schema";

const ts_client = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mysecretpassword",
  port: 5432,
});

const rds_client = createClient();

async function main() {
  try {
    await ts_client.connect();
    await rds_client.connect();
    console.log("WORKER AND DB CONNECTED");

    while (true) {
      try {
        const resp = await rds_client.brPop("ETDB", 0);
        if (resp === null) continue;
        const raw_data = resp.element;
        const data = v.parse(
          event_queue_popped_data_schema,
          JSON.parse(raw_data),
        );
        process_queue(data);
      } catch (err) {
        console.log("COULD NOT PROCESS QUEUE");
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
    console.log("COULD NOT START WORKER OR DB");
  }
}

async function process_queue(data: EventQueuePoppedData) {
  const type = data.TYPE;
  switch (type) {
    case "trade": {
      const { iso_timestamp, price, quantity, symbol } = data.PAYLOAD;
      const quote_asset = symbol.split("_")[0]!;
      await ts_client.query(
        `INSERT INTO kwh_price (time, price, volume, currency_code)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (time, currency_code)
                 DO UPDATE SET
                     price = EXCLUDED.price,
                     "volume" = kwh_price."volume" + EXCLUDED.volume;`,
        [
          iso_timestamp,
          Number.parseFloat(price),
          Number.parseFloat(quantity),
          quote_asset,
        ],
      );
      break;
    }
  }
}

main();
