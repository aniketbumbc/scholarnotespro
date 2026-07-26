import { OpenAIEmbeddings } from "@langchain/openai";
import { pineconeIndex } from "../config/pinecone";
import { getChunksByIds } from "../models/chunk";

const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" }); // SAME model as ingestion

export type RetrievedChunk = {
  chunkId: string;
  score: number;
  title: string;
  page: number;
  snippet: string;
  text: string; // full text from Mongo
  sourceId: string;
};

export async function retrieve(
  question: string,
  opts: { topK?: number; sourceIds?: string[] } = {}
): Promise<RetrievedChunk[]> {
  // 1. embed the question into the SAME 1536-dim space
  const qVector = await embeddings.embedQuery(question);

  // 2. Pinecone similarity search, optionally scoped to specific sources
  const filter = opts.sourceIds?.length ? { sourceId: { $in: opts.sourceIds } } : undefined;
  const res = await pineconeIndex.query({
    vector: qVector,
    topK: opts.topK ?? 8,
    includeMetadata: true,
    filter,
  });

  // 3. fetch full text from Mongo (small-to-big: Pinecone finds, Mongo reads)
  const ids = res.matches.map((m) => m.id);
  const mongoChunks = await getChunksByIds(ids);

  console.log("[retrieve] mongo returned:", mongoChunks.length, "of", ids.length, "ids");

  const byId = new Map(mongoChunks.map((c) => [c._id, c]));

  // 4. merge, preserving Pinecone's score order
  return res.matches.map((match) => {
    const metadata = match.metadata as any;
    const full = byId.get(match.id as any);
    return {
      chunkId: match.id,
      score: match.score ?? 0,
      title: metadata.title,
      page: metadata.page,
      snippet: metadata.snippet,
      text: full?.text ?? metadata.snippet, // fall back to snippet if Mongo miss
      sourceId: metadata.sourceId,
    };
  });
}
