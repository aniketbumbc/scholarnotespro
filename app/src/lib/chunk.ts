import { randomUUID } from "node:crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { PageText } from "./pdfExtract";

export type Chunk = {
  chunkId: string; // UUID — what the LLM cites, what Pinecone keys on
  sourceId: string;
  sourceType: "pdf";
  title: string;
  chunkIndex: number; // running order across the whole document
  page: number; // inherited from its page (unambiguous)
  charStart: number; // document-global offsets
  charEnd: number;
  text: string; // the chunk (what gets embedded)
  snippet: string; // verbatim text for find-and-highlight (== text for now)
  startSeconds: number;
  endSeconds: number;
  videoId: string;
};

export async function chunkPages(
  pages: PageText[],
  meta: { sourceId: string; title: string },
  opts: { chunkSize?: number; chunkOverlap?: number } = {}
): Promise<Chunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: opts.chunkSize ?? 1000,
    chunkOverlap: opts.chunkOverlap ?? 150,
  });

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    if (!page.text.trim()) continue; // skip empty pages
    const pieces = await splitter.splitText(page.text);

    let searchFrom = 0; // cursor within THIS page
    for (const piece of pieces) {
      const text = piece.trim();
      if (!text) continue;

      // Locate the chunk's position within the page to get true offsets.
      let localPos = page.text.indexOf(piece, searchFrom);
      if (localPos === -1) localPos = page.text.indexOf(text, searchFrom);
      if (localPos === -1) localPos = searchFrom; // fallback: keep going forward

      const charStart = page.charStart + localPos; // page offset + local offset
      const charEnd = charStart + text.length;
      searchFrom = localPos + 1; // advance past this chunk's start

      chunks.push({
        chunkId: randomUUID(),
        sourceId: meta.sourceId,
        sourceType: "pdf",
        title: meta.title,
        chunkIndex: chunkIndex++,
        page: page.page,
        charStart,
        charEnd,
        text,
        snippet: text, // same as text for now; refine later if needed
        startSeconds: 0,
        endSeconds: 0,
        videoId: "",
      });
    }
  }

  return chunks;
}
