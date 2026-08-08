import { NextResponse } from "next/server";
import { getDb as db } from "../../src/config/mongo";
import { getUserId } from "../../src/lib/auth";
import { deleteSource } from "../../src/models/source.model";

export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const database = await db();
  const userSources = await database.collection("sources").find({ userId }).toArray();

  // delete each owned source (vectors + chunks + record) via deleteSource
  for (const s of userSources) await deleteSource(s._id as any);

  return NextResponse.json({ deletedCount: userSources.length });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const sources = await (
    await db()
  )
    .collection("sources")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(
    sources.map((s) => ({
      sourceId: s._id,
      title: s.title,
      sourceType: s.sourceType,
      status: s.status,
      playlistId: s.playlistId,
      videoId: s.videoId,
      error: s.error,
    }))
  );
}
