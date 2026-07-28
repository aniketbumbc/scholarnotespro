import { NextRequest, NextResponse } from "next/server";
import { generateMindMap } from "../../src/lib/mindMap";

export async function POST(req: NextRequest) {
  const { sourceId } = await req.json();
  if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });

  const result = await generateMindMap(sourceId);
  if (!result) return NextResponse.json({ error: "Could not generate mind map" }, { status: 404 });

  return NextResponse.json(result);
}
