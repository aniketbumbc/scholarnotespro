import { NextResponse } from "next/server";
import { deletePlaylist } from "../../../src/models/source.model";
import { getDb as db } from "../../../src/config/mongo";

export async function DELETE(_: Request, { params }: { params: { playlistId: string } }) {
  const { playlistId } = params;

  // confirm the playlist has sources (404 if nothing matches)
  const count = await (await db()).collection("sources").countDocuments({ playlistId });
  if (count === 0) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });

  const result = await deletePlaylist(playlistId);
  return NextResponse.json(result);
}
