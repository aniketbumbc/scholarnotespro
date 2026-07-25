import { pineconeIndex } from "../config/pinecone";
import type { EmbeddedChunk } from "./embed";

export async function upsertChunks(embedded: EmbeddedChunk[]) {
  if (embedded.length === 0) return;

  const vectors = embedded.map((c) => ({
    id: c.chunkId, // UUID — same key as the Mongo _id
    values: c.embedding, // 1536-dim vector
    metadata: {
      sourceId: c.sourceId,
      sourceType: c.sourceType,
      title: c.title,
      chunkIndex: c.chunkIndex,
      page: c.page,
      charStart: c.charStart,
      charEnd: c.charEnd,
      snippet: c.snippet, // for highlight; text lives in Mongo
    },
  }));

  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await pineconeIndex.upsert(vectors.slice(i, i + BATCH));
  }
}
