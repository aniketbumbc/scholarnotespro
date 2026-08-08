import { NextRequest, NextResponse } from "next/server";
import { generateYouTubeTimeline } from "../../src/lib/youtubeTimeline";
import { getUserId } from "../../src/lib/auth";
import { getOwnedSource } from "../../src/models/source.model";

export async function POST(req: NextRequest) {
  const { sourceId } = await req.json();
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const owned = await getOwnedSource(sourceId, userId);
  if (!owned) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  const result = await generateYouTubeTimeline(sourceId);
  if (!result) return NextResponse.json({ error: "Could not generate timeline" }, { status: 404 });

  return NextResponse.json(result);
}
