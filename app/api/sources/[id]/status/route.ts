import { NextResponse } from "next/server";
import { getDb as db } from "../../../../src/config/mongo";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const src = await (await db()).collection("sources").findOne({ _id: id as any });
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ sourceId: src._id, status: src.status, title: src.title });
}
