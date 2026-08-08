import { NextResponse } from "next/server";
import { getOwnedSource } from "../../../../src/models/source.model";
import { getUserId } from "../../../../src/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const src = await getOwnedSource(id, userId);
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ sourceId: src._id, status: src.status, title: src.title });
}
