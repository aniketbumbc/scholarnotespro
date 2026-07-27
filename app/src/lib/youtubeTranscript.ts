import { YoutubeTranscript } from "youtube-transcript";

export type TranscriptSegment = {
  text: string;
  startSeconds: number; // when this segment begins — the deep-link target
  durationSeconds: number;
};

export async function fetchTranscriptSegments(videoId: string): Promise<TranscriptSegment[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId);
  return raw.map((r: any) => ({
    text: r.text,
    startSeconds: Math.floor((r.offset ?? 0) / 1000), // offset is ms in this lib
    durationSeconds: Math.floor((r.duration ?? 0) / 1000),
  }));
}
