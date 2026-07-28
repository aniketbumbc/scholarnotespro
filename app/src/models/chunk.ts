import { getDb } from "../config/mongo";
import type { Chunk } from "../lib/chunk";
import type { YouTubeChunk } from "../lib/youtubeChunkTranscript";

export type StoredChunk = Chunk | YouTubeChunk;

export async function saveChunks(chunks: StoredChunk[]) {
  if (chunks.length === 0) return;

  const docs = chunks.map((c) => ({
    _id: c.chunkId as any,
    sourceId: c.sourceId,
    sourceType: c.sourceType,
    title: c.title,
    chunkIndex: c.chunkIndex,
    text: c.text,
    snippet: c.snippet,
    createdAt: new Date(),
    // PDF-only
    ...("page" in c && c.page !== undefined
      ? { page: c.page, charStart: c.charStart, charEnd: c.charEnd }
      : {}),
    // YouTube-only
    ...(c.sourceType === "youtube"
      ? {
          videoId: c.videoId,
          startSeconds: c.startSeconds,
          endSeconds: c.endSeconds,
          playlistId: c.playlistId,
        }
      : {}),
  }));

  const db = await getDb();
  await db.collection("chunks").insertMany(docs, { ordered: false });
}

// Companion delete — the doc-store side of idempotent re-ingest (Step 2's partner)
export async function deleteChunksBySource(sourceId: string) {
  const db = await getDb();
  await db.collection("chunks").deleteMany({ sourceId });
}

export async function getChunksByIds(chunkIds: string[]) {
  const db = await getDb();
  return db
    .collection("chunks")
    .find({ _id: { $in: chunkIds as any } })
    .toArray();
}

export async function getChunksBySource(sourceId: string) {
  const db = await getDb();
  return db
    .collection<StoredChunk>("chunks")
    .find({ sourceId })
    .sort({ chunkIndex: 1 }) // in document order — critical for coherent summary
    .toArray();
}
