import { YoutubeTranscript } from "youtube-transcript";

export type TranscriptSegment = {
  text: string;
  startSeconds: number; // when this segment begins — the deep-link target
  durationSeconds: number;
};

// YouTube blocks transcript scraping from datacenter IPs (the VPS), so production
// uses the Supadata API when SUPADATA_API_KEY is set; local dev falls back to scraping.
export async function fetchTranscriptSegments(videoId: string): Promise<TranscriptSegment[]> {
  if (process.env.SUPADATA_API_KEY) return fetchFromSupadata(videoId, process.env.SUPADATA_API_KEY);

  const raw = await YoutubeTranscript.fetchTranscript(videoId);
  return raw.map((r) => ({
    text: r.text,
    startSeconds: Math.floor((r.offset ?? 0) / 1000), // offset is ms in this lib
    durationSeconds: Math.floor((r.duration ?? 0) / 1000),
  }));
}

/* ---------- Supadata (https://docs.supadata.ai) ---------- */

const SUPADATA_URL = "https://api.supadata.ai/v1/transcript";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // long videos are processed as async jobs

type SupadataChunk = { text: string; offset: number; duration: number }; // offset/duration in ms

async function fetchFromSupadata(videoId: string, apiKey: string): Promise<TranscriptSegment[]> {
  const url = new URL(SUPADATA_URL);
  url.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
  url.searchParams.set("mode", "native"); // existing captions only — no paid AI generation

  const res = await fetch(url, { headers: { "x-api-key": apiKey } });

  // 206 = no transcript for this video -> empty list; the worker marks the source failed
  if (res.status === 206) return [];
  if (!res.ok) throw new Error(`[Supadata] ${res.status}: ${await errorMessage(res)}`);

  const data = await res.json();
  // 202 = large video, processed as a job we have to poll
  const content: SupadataChunk[] =
    res.status === 202 && data.jobId ? await pollJob(data.jobId, apiKey) : data.content;

  return (content ?? []).map((c) => ({
    text: c.text,
    startSeconds: Math.floor((c.offset ?? 0) / 1000),
    durationSeconds: Math.floor((c.duration ?? 0) / 1000),
  }));
}

async function pollJob(jobId: string, apiKey: string): Promise<SupadataChunk[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${SUPADATA_URL}/${jobId}`, { headers: { "x-api-key": apiKey } });
    if (!res.ok)
      throw new Error(`[Supadata] job ${jobId} ${res.status}: ${await errorMessage(res)}`);

    const job = await res.json();
    if (job.status === "completed") return job.content ?? [];
    if (job.status === "failed") {
      throw new Error(`[Supadata] job ${jobId} failed: ${job.error?.message ?? "unknown error"}`);
    }
    // "queued" | "active" -> keep polling
  }

  throw new Error(`[Supadata] job ${jobId} timed out`);
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ?? body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
