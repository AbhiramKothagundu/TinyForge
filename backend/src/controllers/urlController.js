import { createShortUrl, getLongUrl } from "../models/urlModel.js";
import { getNextId } from "../services/countService.js";

export const shortenUrl = async (req, res) => {
    try {
        const { longUrl } = req.body;
        if (!longUrl) {
            return res.status(400).json({ error: "longUrl is required" });
        }

        const shortUrl = await getNextId();
        const newEntry = await createShortUrl(shortUrl, longUrl);
        res.json({ shortUrl, longUrl: newEntry.long_url });
    } catch (error) {
        console.error("Error in shortenUrl:", error); // Add this line
        res.status(500).json({ error: "Server error" });
    }
};

export const redirectUrl = async (req, res) => {
    try {
        const { shortUrl } = req.params;
        const longUrl = await getLongUrl(shortUrl);
        if (longUrl) {
            return res.redirect(longUrl);
        }
        res.status(404).json({ error: "Not found" });
    } catch (error) {
        console.error("Error in redirectUrl:", error); // Add this line
        res.status(500).json({ error: "Server error" });
    }
};
