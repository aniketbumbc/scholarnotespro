import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getDb as db } from "../../../../src/config/mongo";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sourceId } = await params;

  const src = await (await db()).collection("sources").findOne({ _id: sourceId as any });
  if (!src) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  if (src.sourceType !== "pdf" || !src.filePath) {
    return NextResponse.json({ error: "Not a PDF source" }, { status: 400 });
  }

  try {
    const buf = await readFile(src.filePath as string);
    const filename = `${String(src.title ?? "document").replace(/[^\w.\- ]+/g, "_")}.pdf`;
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF file missing on disk" }, { status: 404 });
  }
}
