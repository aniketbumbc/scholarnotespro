import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getOwnedSource } from "../../../../src/models/source.model";
import { getUserId } from "../../../../src/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sourceId } = await params;

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const src = await getOwnedSource(sourceId, userId);
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
