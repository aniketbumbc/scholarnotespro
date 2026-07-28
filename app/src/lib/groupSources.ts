import type { Source } from "./type";

export interface PlaylistGroup {
  playlistId: string;
  title: string; // derived from first video, or a playlist title if you store one
  videos: Source[];
  ready: number;
  processing: number;
  failed: number;
  total: number;
}

export function groupSources(sources: Source[]) {
  const standalone: Source[] = [];
  const playlists = new Map<string, Source[]>();

  for (const s of sources) {
    if (s.playlistId) {
      const arr = playlists.get(s.playlistId) ?? [];
      arr.push(s);
      playlists.set(s.playlistId, arr);
    } else {
      standalone.push(s);
    }
  }

  const groups: PlaylistGroup[] = [...playlists.entries()].map(([playlistId, videos]) => ({
    playlistId,
    title: "Series", // see note below on titling
    videos,
    ready: videos.filter((v) => v.status === "ready").length,
    processing: videos.filter((v) => v.status === "processing").length,
    failed: videos.filter((v) => v.status === "failed").length,
    total: videos.length,
  }));

  return { standalone, groups };
}
