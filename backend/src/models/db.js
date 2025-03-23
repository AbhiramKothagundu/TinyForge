import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

//retry connection to database
const retryConnect = async (config, retries = 5, delay = 5000) => {
    while (retries > 0) {
        try {
            const pool = new Pool(config);
            await pool.query("SELECT 1");
            console.log(
                `✅ Connected to PostgreSQL at ${config.connectionString}`
            );
            return pool;
        } catch (error) {
            console.error(
                `❌ Error connecting to PostgreSQL, retrying... (${retries} left)`
            );
            retries--;
            await new Promise((res) => setTimeout(res, delay));
        }
    }
    throw new Error(
        `Failed to connect to PostgreSQL: ${config.connectionString}`
    );
};

const shardConfigs = [
    process.env.DATABASE_URL_1,
    process.env.DATABASE_URL_2,
    process.env.DATABASE_URL_3,
];

export const shards = await Promise.all(
    shardConfigs.map((connectionString) => retryConnect({ connectionString }))
);

console.log("✅ All database shards initialized successfully.");

export const getShard = (shortUrl) => {
    const hash = shortUrl
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return shards[hash % shards.length];
};
