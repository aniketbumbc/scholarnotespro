import "dotenv/config";
import { Redis } from "ioredis";

export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required by BullMQ
});
console.log("[redis] URL:", process.env.REDIS_URL?.slice(0, 30));
console.log("[redis] URL Full:", process.env.REDIS_URL);
