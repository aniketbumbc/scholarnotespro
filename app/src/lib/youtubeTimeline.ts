import dotenv from "dotenv";
import OpenAI from "openai";
import { z } from "zod";
import { getChunksBySource } from "../models/chunk";

dotenv.config();

const openai = new OpenAI();

const chapterSchema = z.object({
  chapters: z.array(
    z.object({
      startSeconds: z.number().describe("Where this chapter begins (from the [Ns] markers)"),
      title: z.string().describe("Short chapter title"),
      description: z.string().describe("What this section covers, 1-2 sentences"),
    })
  ),
});

export async function generateYouTubeTimeline(sourceId: string) {
  const chunks = await getChunksBySource(sourceId);
  if (chunks.length === 0) return null;

  const videoId = (chunks[0] as any).videoId;
  const title = chunks[0].title;

  // Feed each chunk WITH its start time so the LLM can anchor chapters to real moments
  const context = chunks.map((c: any) => `[${c.startSeconds}s] ${c.text}`).join("\n\n");

  // The last chunk's end time = the video's end, for the final chapter's endSeconds
  const videoEnd = (chunks[chunks.length - 1] as any).endSeconds;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You create chapter markers for a video transcript. The transcript is " +
          "segmented with [Ns] markers showing the start time in seconds of each part. " +
          "Group the content into 4-10 topical chapters. For each chapter, report:\n" +
          "- startSeconds: the start time of where the topic begins (pick from the [Ns] markers)\n" +
          "- title: a short, descriptive chapter title\n" +
          "- description: 1-2 sentences on what is covered\n" +
          "Chapters must be in chronological order and startSeconds must increase. " +
          "Use ONLY the real [Ns] values — do not invent times. " +
          'Reply ONLY as JSON: {"chapters":[{"startSeconds":N,"title":"...","description":"..."}]}',
      },
      { role: "user", content: `Video: ${title}\n\n${context}` },
    ],
  });

  const parsed = chapterSchema.safeParse(JSON.parse(res.choices[0].message.content!));
  if (!parsed.success) return null;

  // Derive endSeconds: each chapter ends where the next begins; last ends at video end
  const chapters = parsed.data.chapters
    .sort((a, b) => a.startSeconds - b.startSeconds) // ensure order
    .map((ch, i, arr) => {
      const endSeconds = i < arr.length - 1 ? arr[i + 1].startSeconds : videoEnd;
      return {
        ...ch,
        endSeconds,
        // the clickable deep-link for the UI
        deepLink: `https://youtube.com/watch?v=${videoId}&t=${ch.startSeconds}s`,
      };
    });

  return { sourceId, videoId, title, chapters };
}
