import { getDb } from "../config/mongo";
import type { Chunk } from "../lib/chunk";

export async function saveChunks(chunks: Chunk[]) {
  if (chunks.length === 0) return;

  const docs = chunks.map((c) => ({
    _id: c.chunkId as any, // chunkId IS the Mongo _id — same key Pinecone uses
    sourceId: c.sourceId,
    sourceType: c.sourceType,
    title: c.title,
    chunkIndex: c.chunkIndex,
    page: c.page,
    charStart: c.charStart,
    charEnd: c.charEnd,
    text: c.text,
    snippet: c.snippet,
    createdAt: new Date(),
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
