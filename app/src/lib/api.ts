const BASE = ""; // same-origin (Next API routes)

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // sources
  listSources: () => req<Source[]>("/api/sources"),
  sourceStatus: (id: string) => req<Source>(`/api/sources/${id}/status`),
  uploadPdf: (form: FormData) =>
    fetch("/api/sources/upload", { method: "POST", body: form }).then((r) => r.json()),
  addYouTube: (url: string, title?: string) =>
    req("/api/sources/youtube", { method: "POST", body: JSON.stringify({ url, title }) }),
  deleteSource: (id: string) => req(`/api/sources/${id}`, { method: "DELETE" }),
  deletePlaylist: (id: string) => req(`/api/playlists/${id}`, { method: "DELETE" }),
  deleteAll: () => req("/api/sources", { method: "DELETE" }),
  playlistStatus: (id: string) => req<PlaylistStatus>(`/api/playlists/${id}/status`),

  // query + generation
  query: (body: QueryRequest) =>
    req<QueryResponse>("/api/query", { method: "POST", body: JSON.stringify(body) }),
  summary: (sourceId: string) =>
    req<SummaryResult>("/api/summary", { method: "POST", body: JSON.stringify({ sourceId }) }),
  timeline: (sourceId: string) =>
    req<TimelineResult>("/api/youtube-timeline", {
      method: "POST",
      body: JSON.stringify({ sourceId }),
    }),
  studyGuide: (sourceId: string) =>
    req<StudyGuideResult>("/api/study-guide", {
      method: "POST",
      body: JSON.stringify({ sourceId }),
    }),
  mindMap: (sourceId: string) =>
    req<MindMapResult>("/api/mind-map", { method: "POST", body: JSON.stringify({ sourceId }) }),
};

import type {
  Source,
  PlaylistStatus,
  QueryRequest,
  QueryResponse,
  SummaryResult,
  TimelineResult,
  StudyGuideResult,
  MindMapResult,
} from "./type";
