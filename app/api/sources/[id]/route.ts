import { NextResponse } from "next/server";
import { deleteSource } from "../../../src/models/source.model";
import { getDb as db } from "../../../src/config/mongo";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const sourceId = params.id;

  // confirm it exists first (so you can return 404 vs silent success)
  const src = await (await db()).collection("sources").findOne({ _id: sourceId as any });
  if (!src) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  await deleteSource(sourceId);
  return NextResponse.json({ sourceId, deleted: true, title: src.title });
}
