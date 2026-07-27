import { VIDEO_ID, PLAYLIST_ID } from "./validate";

export type ParsedYouTube =
  { kind: "video"; videoId: string } | { kind: "playlist"; playlistId: string };

export function parseYouTubeUrl(raw: string): ParsedYouTube {
  const url = new URL(raw);
  const host = url.hostname.replace(/^www\./, "");

  // Pure playlist page: /playlist?list=...
  if (url.searchParams.get("list")) {
    const playlistId = url.searchParams.get("list")!;
    if (!PLAYLIST_ID.test(playlistId)) throw new Error(`Invalid playlist ID: ${playlistId}`);
    return { kind: "playlist", playlistId };
  }

  const m = url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/);
  if (m) return { kind: "video", videoId: m[1] };

  // watch?v=<id>  — treat as SINGLE video even if &list= is present
  const v = url.searchParams.get("v");
  if (v) return { kind: "video", videoId: v };

  const playlistId = url.searchParams.get("list");
  if (playlistId) return { kind: "playlist", playlistId };

  throw new Error("Unrecognized YouTube URL");
}

export async function fetchPlaylistItems(playlistId: string) {
  const key = process.env.YOUTUBE_API_KEY;
  const playlistItemsUrl = process.env.YOUTUBE_API_PLAYLIST_ITEMS_URL;
  if (!key || !playlistItemsUrl)
    throw new Error("YOUTUBE_API_KEY or YOUTUBE_API_PLAYLIST_ITEMS_URL missing");

  const items: { videoId: string; title: string }[] = [];
  let pageToken: string | undefined;

  do {
    const u = new URL(playlistItemsUrl);
    u.searchParams.set("part", "snippet,contentDetails");
    u.searchParams.set("playlistId", playlistId);
    u.searchParams.set("maxResults", "50");
    u.searchParams.set("key", key);
    if (pageToken) u.searchParams.set("pageToken", pageToken);

    const res = await fetch(u);
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);
    const data = await res.json();

    for (const it of data.items ?? []) {
      const videoId = it.contentDetails?.videoId;
      if (!VIDEO_ID.test(videoId)) throw new Error(`Invalid video ID: ${videoId}`);
      const title = it.snippet?.title;
      // skip private/deleted entries — they can't be transcribed
      if (videoId && title && !["Private video", "Deleted video"].includes(title)) {
        items.push({ videoId, title });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

export async function fetchVideoDetails(videoId: string) {
  const key = process.env.YOUTUBE_API_KEY;
  const videoDetailsUrl = process.env.YOUTUBE_API_VIDEO_DETAILS_URL;
  if (!key || !videoDetailsUrl)
    throw new Error("YOUTUBE_API_KEY or YOUTUBE_API_VIDEO_DETAILS_URL missing");

  const finalUrl = new URL(videoDetailsUrl);
  finalUrl.searchParams.set("part", "snippet,contentDetails");
  finalUrl.searchParams.set("id", videoId);
  finalUrl.searchParams.set("key", key);

  const res = await fetch(finalUrl);
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = await res.json();
  console.log(data);
  return data;
}
