import express from "express";
import redisClient from "./redis.js";
import { connectRabbit, sendToQueue } from "./rabbit.js";

await connectRabbit();
const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, email, message } = req.body;

  // 1️⃣ RATE LIMIT (5 message per minute)
  const rateKey = `rate:${userId}`;
  const count = await redisClient.incr(rateKey);  //this line of code do , check if redis key present or 
  // not if redis rateKey not present it create key whit value 0 and incresse then by one

  if (count === 1) await redisClient.expire(rateKey, 60);

  if (count > 5) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // 2️⃣ DEDUPLICATION
  const dedupKey = `dedup:${userId}:${message}`;
  if (await redisClient.get(dedupKey)) {
    return res.json({ status: "Duplicate ignored" });
  }
  await redisClient.setEx(dedupKey, 600, "1");

  // 3️⃣ SEND TO QUEUE
  sendToQueue({
    userId,
    email,
    message,
    retry: 0
  });

  res.json({ status: "Queued" });
});

export  { router }
