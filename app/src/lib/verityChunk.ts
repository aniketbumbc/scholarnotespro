import type { RetrievedChunk } from "./retrieve";
import type { Answer } from "./answer";

export type Citation = {
  chunkId: string;
  sourceId: string;
  title: string;
  page: number;
  snippet: string;
  startSeconds?: number;
  endSeconds?: number;
  sourceType?: string;
};

export function verifyCitations(result: Answer, sent: RetrievedChunk[]) {
  const byId = new Map(sent.map((chunk) => [chunk.chunkId, chunk]));

  const validCitations: Citation[] = [];
  const fabricated: string[] = [];

  for (const chunkId of result.citedChunkIds) {
    const chunk = byId.get(chunkId);
    if (chunk && chunk.sourceType !== "youtube") {
      validCitations.push({
        chunkId: chunk!.chunkId,
        sourceId: chunk!.sourceId,
        title: chunk!.title,
        page: chunk!.page,
        snippet: chunk!.snippet,
      });
    } else if (chunk && chunk.sourceType === "youtube") {
      validCitations.push({
        chunkId: chunk!.chunkId,
        sourceId: chunk!.sourceId,
        title: chunk!.title,
        page: 0,
        snippet: chunk!.snippet,
        startSeconds: chunk!.startSeconds,
        endSeconds: chunk!.endSeconds,
      });
    } else {
      fabricated.push(chunkId); // model cited an id we never sent = hallucinated
    }
  }

  // strict rule: a "found" answer with NO valid citation is untrustworthy
  const trustworthy = !result.foundInSources || validCitations.length > 0;

  return { validCitations, fabricated, trustworthy };
}
