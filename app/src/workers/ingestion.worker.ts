import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "../config/redis";
import { setSourceStatus } from "../models/source.model";

const worker = new Worker(
  "ingestion",
  async (job) => {
    const { sourceId, title } = job.data;

    // STEP 1 — mark processing (DONE)
    await setSourceStatus(sourceId, "processing");
    console.log(`[ingest] processing ${sourceId} — ${title}`);

    // STEP 2 — delete existing Pinecone vectors for sourceId (idempotent)   TODO
    // STEP 3 — extract PDF text with page numbers + char offsets            TODO
    // STEP 4 — chunk: stamp page / charStart / charEnd / chunkIndex / UUID  TODO
    // STEP 5 — write parent chunk text to Mongo doc store                   TODO
    // STEP 6 — embed chunks (LangChain + OpenAI embeddings)                 TODO
    // STEP 7 — upsert vectors + flat metadata to Pinecone                   TODO

    // STEP 8 — mark ready (stubbed until 2–7 exist)
    await setSourceStatus(sourceId, "ready");
    console.log(`[ingest] done ${sourceId}`);
  },
  { connection }
);

worker.on("failed", async (job, err) => {
  if (job) await setSourceStatus(job.data.sourceId, "failed", { error: err.message });
  console.error(`[ingest] failed ${job?.id}: ${err.message}`);
});

console.log('[worker] listening on "ingestion" queue');
