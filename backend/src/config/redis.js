import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redis = createClient({
    url: process.env.REDIS_URL, // e.g. redis://localhost:6379
});

redis.on("error", (err) => console.error("Redis Error:", err));

await redis.connect();
console.log("✅ Redis connected");

export default redis;
