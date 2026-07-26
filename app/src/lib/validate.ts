export const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB — tune to taste

// A real PDF starts with the magic bytes "%PDF-"
function looksLikePdf(buf: Buffer): boolean {
  return buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

export function validatePdf(file: File, buf: Buffer): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: "File is empty" };
  if (file.size > MAX_PDF_BYTES)
    return { ok: false, error: `File exceeds ${MAX_PDF_BYTES / 1024 / 1024} MB limit` };
  if (file.type && file.type !== "application/pdf")
    return { ok: false, error: "File is not a PDF (wrong MIME type)" };
  if (!looksLikePdf(buf)) return { ok: false, error: "File content is not a valid PDF" };
  return { ok: true };
}

// YouTube video IDs are 11 chars; playlist IDs start with PL/UU/LL/FL etc.
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,}$/;

export function validateYouTubeInput(
  raw: unknown
): { ok: true; url: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.trim() === "") return { ok: false, error: "URL is required" };

  let host: string;
  try {
    host = new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return { ok: false, error: "Not a valid URL" };
  }

  const allowed = ["youtube.com", "youtu.be", "m.youtube.com"];
  if (!allowed.includes(host)) return { ok: false, error: "Only YouTube URLs are supported" };

  return { ok: true, url: raw.trim() };
}

export { VIDEO_ID, PLAYLIST_ID };
