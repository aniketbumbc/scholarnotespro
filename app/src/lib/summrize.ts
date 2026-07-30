import OpenAI from "openai";
import { getChunksBySource } from "../models/chunk";

const openai = new OpenAI();

export type SummaryResult = {
  id: string;
  summary: string;
  sourceId: string;
  title: string;
  chunkCount: number;
};

export async function summarizeSource(sourceId: string): Promise<SummaryResult | null> {
  // 1. fetch ALL chunks, in order
  const chunks = await getChunksBySource(sourceId);
  if (chunks.length === 0) return null;

  // 2. reassemble full document text
  const fullText = chunks.map((c) => c.text).join("\n\n");
  const title = chunks[0].title;

  // 3. single-pass summary (fits context for small docs)
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You summarize a document for a user. Produce clear Markdown only.\n" +
          "Structure rules:\n" +
          "- Start with a short title heading (## Title).\n" +
          "- Use #### for episode/section headings, each on its own line.\n" +
          "- Under each section, use a bullet list: one `- **Term**: explanation` per line.\n" +
          "- Put a blank line before each heading.\n" +
          "- Never put multiple bullets or headings on the same line.\n" +
          "- Cover all major sections. Use only the provided content — do not add outside information.\n" +
          "- If the document has a day-by-day or sequential structure, preserve that order.",
      },
      {
        role: "user",
        content: `Document title: ${title}\n\n${fullText}\n\nSummarize this document.`,
      },
    ],
  });

  return {
    id: sourceId,
    summary: res.choices[0].message.content ?? "",
    sourceId,
    title,
    chunkCount: chunks.length,
  };
}
