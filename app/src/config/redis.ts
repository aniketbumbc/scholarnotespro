import "dotenv/config";
import { Redis } from "ioredis";

export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required by BullMQ
});
//connection.on("error", (e) => console.error("[redis] connection error:", e.message));
//connection.on("connect", () => console.log("[redis] connected"));
console.log("[redis] URL:", process.env.REDIS_URL?.slice(0, 30));
console.log("[redis] URL Full:", process.env.REDIS_URL);
