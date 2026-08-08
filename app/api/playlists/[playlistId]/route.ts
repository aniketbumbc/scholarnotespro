import { NextResponse } from "next/server";
import { deletePlaylist, getOwnedSource } from "../../../src/models/source.model";
import { getDb as db } from "../../../src/config/mongo";
import { getUserId } from "../../../src/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const owned = await getOwnedSource(playlistId, userId);
  if (!owned) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  // confirm the playlist has sources (404 if nothing matches)
  const count = await (await db()).collection("sources").countDocuments({ playlistId, userId });
  if (count === 0) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });

  const result = await deletePlaylist(playlistId, userId);
  return NextResponse.json(result);
}
