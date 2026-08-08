import { NextRequest, NextResponse } from "next/server";
import { createSource } from "../../../src/models/source.model";
import { ingestionQueue } from "../../../src/queue/ingestion.queue";
import { validatePdf } from "@/app/src/lib/validate";
import { getUserId } from "../../../src/lib/auth";
import { uploadPdf } from "../../../src/lib/storage";
import { updateSourceStoragePath } from "../../../src/models/source.model";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());

  const validation = validatePdf(file, buf);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const title = (form.get("title") as string) || file.name;

  // create the source first — we key the storage path by sourceId
  const sourceId = await createSource({
    title,
    sourceType: "pdf",
    userId,
  });

  // upload the PDF to Supabase (returns the storage path, e.g. "<sourceId>.pdf")
  const storagePath = await uploadPdf(sourceId, buf);

  // store the storage path on the source, and pass it to the worker
  await updateSourceStoragePath(sourceId, storagePath);

  await ingestionQueue.add("ingest-pdf", { sourceId, title, storagePath, userId });

  return NextResponse.json({ sourceId, status: "queued" });
}
