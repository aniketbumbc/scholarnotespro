import { Queue } from "bullmq";
import { connection } from "../config/redis";

export const ingestionQueue = new Queue("ingestion", { connection });
