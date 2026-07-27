import { pineconeIndex } from "../config/pinecone";
import type { EmbeddedChunk } from "./embed";

export async function upsertChunks(embedded: EmbeddedChunk[]) {
  if (embedded.length === 0) return;

  const vectors = embedded.map((c) => ({
    id: c.chunkId,
    values: c.embedding,
    metadata: {
      // common fields (both types)
      sourceId: c.sourceId,
      sourceType: c.sourceType,
      title: c.title,
      chunkIndex: c.chunkIndex,
      snippet: c.snippet,
      // PDF-only fields (added only when present)
      ...("page" in c && c.page !== undefined
        ? { page: c.page, charStart: c.charStart, charEnd: c.charEnd }
        : {}),
      // YouTube-only fields (added only when present)
      ...("startSeconds" in c && c.startSeconds !== undefined
        ? {
            videoId: c.videoId,
            startSeconds: c.startSeconds,
            endSeconds: c.endSeconds,
            ...(c.playlistId ? { playlistId: c.playlistId } : {}),
          }
        : {}),
    },
  }));

  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await pineconeIndex.upsert(vectors.slice(i, i + BATCH));
  }
}
