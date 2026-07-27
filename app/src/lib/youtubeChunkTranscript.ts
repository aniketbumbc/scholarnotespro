import { randomUUID } from "node:crypto";
import type { TranscriptSegment } from "./youtubeTranscript";

export type YouTubeChunk = {
  chunkId: string;
  sourceId: string;
  sourceType: "youtube";
  title: string;
  chunkIndex: number;
  videoId: string;
  startSeconds: number; // deep-link target
  endSeconds: number;
  text: string;
  snippet: string;
  playlistId?: string;
};

export function chunkTranscript(
  segments: TranscriptSegment[],
  meta: { sourceId: string; title: string; videoId: string; playlistId?: string },
  windowSeconds = 45 // merge ~45s of speech per chunk
): YouTubeChunk[] {
  const chunks: YouTubeChunk[] = [];
  let buffer: TranscriptSegment[] = [];
  let windowStart = segments[0]?.startSeconds ?? 0;
  let chunkIndex = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer
      .map((s) => s.text)
      .join(" ")
      .trim();
    const last = buffer[buffer.length - 1];
    chunks.push({
      chunkId: randomUUID(),
      sourceId: meta.sourceId,
      sourceType: "youtube",
      title: meta.title,
      chunkIndex: chunkIndex++,
      videoId: meta.videoId,
      startSeconds: buffer[0].startSeconds, // first segment's start
      endSeconds: last.startSeconds + last.durationSeconds,
      text,
      snippet: text,
      playlistId: meta.playlistId,
    });
    buffer = [];
  };

  for (const seg of segments) {
    // start a new chunk once the window duration is exceeded
    if (seg.startSeconds - windowStart >= windowSeconds && buffer.length > 0) {
      flush();
      windowStart = seg.startSeconds;
    }
    buffer.push(seg);
  }
  flush();

  return chunks;
}
