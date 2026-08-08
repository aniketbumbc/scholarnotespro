import { NextResponse } from "next/server";
import { deleteSource, getOwnedSource } from "../../../src/models/source.model";
import { getUserId } from "../../../src/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const owned = await getOwnedSource(id, userId);
  if (!owned) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  await deleteSource(id);
  return NextResponse.json({ sourceId: id, deleted: true, title: owned.title });
}
