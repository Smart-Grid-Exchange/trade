import {Client} from "pg";

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'mysecretpassword',
    port: 5432,
});

async function initialize_db(){
    await client.connect();

    await client.query(`
        DROP TABLE IF EXISTS "kwh_price" CASCADE;
        CREATE TABLE "kwh_price"(
            time    TIMESTAMP WITH TIME ZONE NOT NULL,
            price   DOUBLE PRECISION,
            volume  DOUBLE PRECISION,
            currency_code VARCHAR(10)
        );

        ALTER TABLE kwh_price ADD CONSTRAINT unique_time_currency UNIQUE (time, currency_code);

        SELECT create_hypertable('kwh_price','time');
    `);


    // Commit the transaction before creating a materialized view
    await client.query("COMMIT");

    await client.query(`
        CREATE MATERIALIZED VIEW klines_1m
        WITH (timescaledb.continuous=true) AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price,time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM kwh_price
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW klines_1h
        WITH (timescaledb.continuous=true) AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price,time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM kwh_price
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW klines_1w
        WITH (timescaledb.continuous=true) AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price,time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM kwh_price
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        SELECT add_continuous_aggregate_policy('klines_1m',
            start_offset => INTERVAL '3 minutes',
            end_offset => INTERVAL '1 minute',
            schedule_interval => INTERVAL '1 minute');
    `)

    await client.query(`
        SELECT add_continuous_aggregate_policy('klines_1h',
            start_offset => INTERVAL '3 hours',
            end_offset => INTERVAL '1 hour',
            schedule_interval => INTERVAL '1 hour');
    `)

    await client.query(`
        SELECT add_continuous_aggregate_policy('klines_1w',
            start_offset => INTERVAL '3 weeks',
            end_offset => INTERVAL '1 week',
            schedule_interval => INTERVAL '1 week');
    `)

    await client.end();
    console.log("DATABASE INITIALIZED SUCCESSFULLY")
}

initialize_db().catch(console.error);