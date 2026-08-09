import "dotenv/config";
import { Redis } from "ioredis";

export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required by BullMQ
  family: 0, // ← IPv6 for Railway .railway.internal
});
connection.on("connect", () => console.log("[redis] connected ✓"));
connection.on("error", (e) => console.error("[redis] error:", e.message, e));
console.log("[redis] URL:", process.env.REDIS_URL?.slice(0, 30));
console.log("[redis] URL Full:", process.env.REDIS_URL);
