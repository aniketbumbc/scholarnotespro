import { NextRequest, NextResponse } from "next/server";
import { createSource } from "../../../src/models/source.model";
import { ingestionQueue } from "../../../src/queue/ingestion.queue";
import { parseYouTubeUrl, fetchPlaylistItems, fetchVideoDetails } from "../../../src/lib/youtube";

export async function POST(req: NextRequest) {
  const { url, title } = await req.json();
  const videoId = url.split("v=")[1];
  if (!url) return NextResponse.json({ error: "No url" }, { status: 400 });

  let parsed;
  try {
    parsed = parseYouTubeUrl(url);
  } catch (error) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  // --- SINGLE VIDEO: one source, one job ---
  if (parsed.kind === "video") {
    const videoDetails = await fetchVideoDetails(videoId);
    const videoTitle = videoDetails.items[0].snippet.title;
    const sourceId = await createSource({
      title: videoTitle || "YouTube Video", // enriched during ingestion (oEmbed/transcript)
      sourceType: "youtube",
      videoId: parsed.videoId,
    });
    await ingestionQueue.add("ingest-youtube", {
      sourceId,
      title: videoTitle,
      filePath: "YouTube Video",
      videoId: parsed.videoId,
    });
    return NextResponse.json({ kind: "video", sources: [{ sourceId, videoId: parsed.videoId }] });
  }

  const videos = await fetchPlaylistItems(parsed.playlistId);
  const sources = [];

  for (const { videoId, title: vTitle } of videos) {
    const sourceId = await createSource({
      title: vTitle || "YouTube Video", // already have the title from playlistItems
      sourceType: "youtube",
      videoId,
      playlistId: parsed.playlistId, // shared "series" tag
    });

    await ingestionQueue.add("ingest-youtube-playlist", {
      sourceId,
      title: vTitle,
      filePath: "YouTube Playlist",
      videoId, // the only locator a YouTube job needs
      playlistId: parsed.playlistId,
    });

    sources.push({ sourceId, videoId, title: vTitle, playlistId: parsed.playlistId });
  }

  return NextResponse.json({
    kind: "playlist",
    count: sources.length,
    sources,
    playlistId: parsed.playlistId,
  });
}
