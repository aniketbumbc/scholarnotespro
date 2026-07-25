import "dotenv/config";
import { Job, Worker } from "bullmq";
import { connection } from "../config/redis";
import { setSourceStatus } from "../models/source.model";
import { pineconeIndex } from "../config/pinecone";
import { extractPdfPages } from "../lib/pdfExtract";

type IngestionJobData = {
  sourceId: string;
  title: string;
  filePath?: string;
  videoId?: string;
};

const worker = new Worker(
  "ingestion",
  async (job: Job<IngestionJobData>) => {
    const { sourceId, title, filePath, videoId } = job.data;

    // STEP 1 — mark processing (DONE)
    await setSourceStatus(sourceId, "processing");
    console.log(`[ingest] processing ${sourceId} — ${title}`);

    // ******************************************************

    // STEP 2 — delete existing Pinecone vectors for sourceId (idempotent)

    try {
      await pineconeIndex.deleteMany({ sourceId });
    } catch (e) {
      console.warn(`[ingest] no existing vectors to delete for ${sourceId}`);
    }

    // ******************************************************

    // STEP 3 — extract PDF text with page numbers + char offsets
    if (filePath && !videoId) {
      const pages = await extractPdfPages(filePath);
      console.log(`[ingest] ${sourceId}: extracted ${pages.length} pages`);
    }

    // ******************************************************

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
