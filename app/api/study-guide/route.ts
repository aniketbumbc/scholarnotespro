import { NextRequest, NextResponse } from "next/server";
import { generateStudyGuide } from "../../src/lib/studyGuide";
import { getUserId } from "../../src/lib/auth";
import { getOwnedSource } from "../../src/models/source.model";

export async function POST(req: NextRequest) {
  const { sourceId } = await req.json();
  if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const owned = await getOwnedSource(sourceId, userId);
  if (!owned) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  const result = await generateStudyGuide(sourceId);
  if (!result)
    return NextResponse.json({ error: "Could not generate study guide" }, { status: 404 });

  return NextResponse.json(result);
}
