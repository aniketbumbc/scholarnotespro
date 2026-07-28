import { NextRequest, NextResponse } from "next/server";
import { generateStudyGuide } from "../../src/lib/studyGuide";

export async function POST(req: NextRequest) {
  const { sourceId } = await req.json();
  if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });

  const result = await generateStudyGuide(sourceId);
  if (!result)
    return NextResponse.json({ error: "Could not generate study guide" }, { status: 404 });

  return NextResponse.json(result);
}
