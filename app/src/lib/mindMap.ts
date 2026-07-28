import OpenAI from "openai";
import { z } from "zod";
import { getChunksBySource } from "../models/chunk";

const openai = new OpenAI();

// A node references itself via children — z.lazy handles recursion
type MindMapNode = {
  title: string;
  startSeconds?: number; // YouTube: seek target
  page?: number; // PDF: jump target
  snippet?: string; // PDF: text to highlight
  children: MindMapNode[];
};

const nodeSchema: z.ZodType<MindMapNode> = z.lazy(() =>
  z.object({
    title: z.string(),
    startSeconds: z.number().optional(),
    page: z.number().optional(),
    snippet: z.string().optional(),
    children: z.array(nodeSchema),
  })
);

const mindMapSchema = z.object({ root: nodeSchema });

export async function generateMindMap(sourceId: string) {
  const chunks = await getChunksBySource(sourceId);
  if (chunks.length === 0) return null;

  const isVideo = chunks[0].sourceType === "youtube";
  const title = chunks[0].title;
  const videoId = isVideo ? chunks[0].videoId : undefined;

  // context WITH anchors, so the LLM can tag each node
  const context = chunks
    .map((c) =>
      c.sourceType === "youtube"
        ? `[${c.startSeconds}s] ${c.text}`
        : `[page ${c.page}] ${c.text}`
    )
    .join("\n\n");

  const anchorRule = isVideo
    ? 'For EVERY node (including children), set "startSeconds" to the time (from the [Ns] markers) where that topic is discussed. Use ONLY real [Ns] values.'
    : 'For EVERY node (including children), set "page" to the page number (from the [page N] markers) where that topic appears, and "snippet" to a short verbatim phrase (5-12 words) copied exactly from that part of the text, for highlighting. Use ONLY real page numbers and verbatim text.';

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Build a hierarchical mind map of the document as a tree. " +
          "The root is the main topic; branches are major themes; leaves are specific points. " +
          '2-4 levels deep. Each node has a "title" and "children" array. ' +
          anchorRule +
          " " +
          'Reply ONLY as JSON: {"root":{"title":"...","<anchor fields>":...,"children":[...]}}',
      },
      { role: "user", content: `Document: ${title}\n\n${context}` },
    ],
  });

  const parsed = mindMapSchema.safeParse(JSON.parse(res.choices[0].message.content!));
  if (!parsed.success) {
    console.warn("[mindMap] parse failed", parsed.error);
    return null;
  }

  const decorate = (node: MindMapNode): any => ({
    title: node.title,
    ...(isVideo && node.startSeconds !== undefined
      ? {
          startSeconds: node.startSeconds,
          deepLink: `https://youtube.com/watch?v=${videoId}&t=${node.startSeconds}s`,
        }
      : {}),
    ...(!isVideo && node.page !== undefined ? { page: node.page, snippet: node.snippet } : {}),
    children: node.children.map(decorate),
  });

  return {
    sourceId,
    title,
    sourceType: isVideo ? "youtube" : "pdf",
    root: decorate(parsed.data.root),
  };
}
