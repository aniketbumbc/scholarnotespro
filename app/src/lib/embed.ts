import { OpenAIEmbeddings } from "@langchain/openai";
import type { Chunk } from "./chunk";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small", // 1536 dims — must match Pinecone index
});

export type EmbeddedChunk = Chunk & { embedding: number[] };

export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) return [];

  // embedDocuments takes an array of strings, returns an array of vectors
  // (same order as input). LangChain batches internally.
  const texts = chunks.map((c) => c.text);
  const vectors = await embeddings.embedDocuments(texts);

  return chunks.map((c, i) => ({ ...c, embedding: vectors[i] }));
}
