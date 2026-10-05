import "dotenv/config";
import { Redis } from "ioredis";

export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required by BullMQ
  family: 0, // resolve both IPv4 and IPv6 hosts
});
