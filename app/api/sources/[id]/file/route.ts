import { NextResponse } from "next/server";
import { getOwnedSource } from "../../../../src/models/source.model";
import { getUserId } from "../../../../src/lib/auth";
import { downloadPdf } from "../../../../src/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sourceId } = await params;

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const owned = await getOwnedSource(sourceId, userId);
  if (!owned) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  if (owned.sourceType !== "pdf" || !owned.storagePath) {
    return NextResponse.json({ error: "Not a PDF source" }, { status: 400 });
  }

  try {
    const buffer = await downloadPdf(owned.storagePath);
    return new NextResponse(Buffer.from(buffer), {
      headers: { "Content-Type": "application/pdf", "Cache-Control": "private, max-age=3600" },
    });
  } catch (err) {
    console.error(`[file] download failed for ${sourceId}:`, err);
    return NextResponse.json({ error: "Failed to retrieve PDF" }, { status: 502 });
  }
}
