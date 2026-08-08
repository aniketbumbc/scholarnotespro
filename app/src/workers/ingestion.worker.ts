import "dotenv/config";
import { Job, Worker } from "bullmq";
import { connection } from "../config/redis";
import { setSourceStatus } from "../models/source.model";
import { pineconeIndex } from "../config/pinecone";
import { extractPdfPages, PageText } from "../lib/pdfExtract";
import { Chunk, chunkPages } from "../lib/chunk";
import { deleteChunksBySource, saveChunks } from "../models/chunk";
import { embedChunks } from "../lib/embed";
import { upsertChunks } from "../lib/upsert";
import { fetchTranscriptSegments } from "../lib/youtubeTranscript";
import { chunkTranscript, YouTubeChunk } from "../lib/youtubeChunkTranscript";

type IngestionJobData = {
  userId: string;
  sourceId: string;
  title: string;
  filePath?: string;
  videoId?: string;
  playlistId?: string;
};

const worker = new Worker(
  "ingestion", // only one job at a time
  async (job: Job<IngestionJobData>) => {
    const { userId, sourceId, title, filePath, videoId, playlistId } = job.data;

    // STEP 1 — mark processing (DONE) flows upload → extract → chunk → store → embed → upsert → ready, with idempotent re-ingest
    await setSourceStatus(sourceId, "processing");

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
    let chunks: Chunk[] | YouTubeChunk[] = [];
    // STEP 3 — extract PDF text with page numbers + char offsets
    if (filePath && !videoId) {
      // STEP 4 — chunk: stamp page / charStart / charEnd / chunkIndex / UUID
      pages = await extractPdfPages(filePath);
      chunks = await chunkPages(pages, { sourceId, title, userId });
    } else if (videoId) {
      const segments = await fetchTranscriptSegments(videoId);
      if (segments.length === 0) {
        await new Promise((r) => setTimeout(r, 2000)); // 2s breather between videos
        throw new Error("No transcript available for this video"); // -> marks failed
      }
      chunks = chunkTranscript(segments, { sourceId, title, videoId, playlistId, userId });
    } else {
      throw new Error("No source type provided. filePath: " + filePath + " videoId: " + videoId);
    }

    // ******************************************************

    // ******************************************************

    // STEP 5 — write parent chunk text to Mongo doc store
    await saveChunks(chunks);

    // ******************************************************

    // STEP 6 — embed chunks (LangChain + OpenAI embeddings)

    const embeddedChunks = await embedChunks(chunks as Chunk[]);

    // ******************************************************

    // STEP 7 — upsert vectors + flat metadata to Pinecone

    await upsertChunks(embeddedChunks);

    // STEP 8 — mark ready (stubbed until 2–7 exist)
    await setSourceStatus(sourceId, "ready");
    console.log(`[ingest] done ${sourceId}`);
  },
  { connection, concurrency: 1 }
);

worker.on("failed", async (job, err) => {
  if (job) await setSourceStatus(job.data.sourceId, "failed", { error: err.message });
  console.error(`[ingest] failed ${job?.id}: ${err.message}`);
});

console.log('[worker] listening on "ingestion" queue');
