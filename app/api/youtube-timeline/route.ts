import { NextRequest, NextResponse } from "next/server";
import { generateYouTubeTimeline } from "../../src/lib/youtubeTimeline";

export async function POST(req: NextRequest) {
  const { sourceId } = await req.json();
  if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });

  const result = await generateYouTubeTimeline(sourceId);
  if (!result) return NextResponse.json({ error: "Could not generate timeline" }, { status: 404 });

  return NextResponse.json(result);
}
