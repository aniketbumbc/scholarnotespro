export type SourceStatus = "queued" | "processing" | "ready" | "failed";
export type SourceType = "pdf" | "youtube";

export interface Source {
  sourceId: string;
  title: string;
  sourceType: SourceType;
  status: SourceStatus;
  playlistId?: string;
  videoId?: string;
  error?: string;
}

export interface PlaylistStatus {
  total: number;
  ready: number;
  failed: number;
  allDone: boolean;
  sources: { sourceId: string; title: string; status: SourceStatus }[];
}

export interface Citation {
  chunkId: string;
  sourceId: string;
  title: string;
  snippet?: string;
  page?: number; // PDF
  videoId?: string; // YouTube
  startSeconds?: number; // YouTube
  endSeconds?: number;
}

export interface QueryRequest {
  question: string;
  sourceIds?: string[];
  playlistId?: string;
}
export interface QueryResponse {
  answer: string;
  citations: Citation[];
  topScore?: number;
  mode?: string;
}

export interface SummaryResult {
  sourceId: string;
  title: string;
  summary: string;
}

export interface TimelineChapter {
  startSeconds: number;
  endSeconds: number;
  title: string;
  description: string;
  deepLink: string;
}
export interface TimelineResult {
  sourceId: string;
  videoId: string;
  title: string;
  chapters: TimelineChapter[];
}

export interface StudyGuideResult {
  sourceId: string;
  title: string;
  overview: string;
  keyConcepts: { term: string; explanation: string }[];
  summaryPoints: string[];
  practiceQuestions: { question: string; answer: string }[];
}

export interface MindMapNode {
  title: string;
  startSeconds?: number;
  deepLink?: string; // YouTube
  page?: number;
  snippet?: string; // PDF
  children: MindMapNode[];
}
export interface MindMapResult {
  sourceId: string;
  title: string;
  sourceType: SourceType;
  root: MindMapNode;
}
