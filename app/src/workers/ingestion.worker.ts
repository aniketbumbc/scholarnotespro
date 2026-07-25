import "dotenv/config";
import { Job, Worker } from "bullmq";
import { connection } from "../config/redis";
import { setSourceStatus } from "../models/source.model";
import { pineconeIndex } from "../config/pinecone";
import { extractPdfPages, PageText } from "../lib/pdfExtract";
import { chunkPages } from "../lib/chunk";
import { deleteChunksBySource, saveChunks } from "../models/chunk";
import { embedChunks } from "../lib/embed";
import { upsertChunks } from "../lib/upsert";

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

    // STEP 1 — mark processing (DONE) flows upload → extract → chunk → store → embed → upsert → ready, with idempotent re-ingest
    await setSourceStatus(sourceId, "processing");
    console.log(`[ingest] processing ${sourceId} — ${title}`);

    // ******************************************************

    // STEP 2 — delete existing Pinecone vectors for sourceId (idempotent)

    try {
      await pineconeIndex.deleteMany({ sourceId });
    } catch (e) {
      console.warn(`[ingest] no existing vectors to delete for ${sourceId}`);
    }
    await deleteChunksBySource(sourceId);

    // ******************************************************
    let pages: PageText[] = [];
    // STEP 3 — extract PDF text with page numbers + char offsets
    if (filePath && !videoId) {
      pages = await extractPdfPages(filePath);
    }

    // ******************************************************

    // STEP 4 — chunk: stamp page / charStart / charEnd / chunkIndex / UUID

    const chunks = await chunkPages(pages, { sourceId, title });
    // ******************************************************

    // STEP 5 — write parent chunk text to Mongo doc store
    await saveChunks(chunks);

    // ******************************************************

    // STEP 6 — embed chunks (LangChain + OpenAI embeddings)

    const embeddedChunks = await embedChunks(chunks);

    // ******************************************************

    // STEP 7 — upsert vectors + flat metadata to Pinecone

    await upsertChunks(embeddedChunks);

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
