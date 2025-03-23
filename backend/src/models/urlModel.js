import { getShard } from "./db.js";

export const createShortUrl = async (shortUrl, longUrl) => {
    const db = getShard(shortUrl);
    const query =
        "INSERT INTO urls (short_url, long_url) VALUES ($1, $2) RETURNING *";
    const result = await db.query(query, [shortUrl, longUrl]);
    return result.rows[0];
};

export const getLongUrl = async (shortUrl) => {
    const db = getShard(shortUrl);
    const query = "SELECT long_url FROM urls WHERE short_url = $1";
    const result = await db.query(query, [shortUrl]);
    return result.rows.length ? result.rows[0].long_url : null;
};
