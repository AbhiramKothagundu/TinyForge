import redis from "../config/redis.js";

// Unique counter key for each server (shard range 0-1M, etc.)
const COUNTER_KEY = "url-counter";

const base62Chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const toBase62 = (num) => {
    let result = "";
    do {
        result = base62Chars[num % 62] + result;
        num = Math.floor(num / 62);
    } while (num > 0);
    return result;
};

export const getNextId = async () => {
    const count = await redis.incr(COUNTER_KEY);
    return toBase62(count);
};
