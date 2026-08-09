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
  console.log("[upload] 1 authed", userId);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  console.log("[upload] 2 file", file);
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  console.log("[upload] 3 buf", buf);
  const validation = validatePdf(file, buf);
  console.log("[upload] 4 validation", validation);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const title = (form.get("title") as string) || file.name;
  console.log("[upload] 5 title", title);
  console.log("[redis] URL Route:", process.env.REDIS_URL);
  // create the source first — we key the storage path by sourceId
  const sourceId = await createSource({
    title,
    sourceType: "pdf",
    userId,
  });
  console.log("[upload] 6 sourceId", sourceId);

  // upload the PDF to Supabase (returns the storage path, e.g. "<sourceId>/<file.name>")
  const storagePath = await uploadPdf(sourceId, file.name, buf);
  console.log("[upload] 7 storagePath", storagePath);
  // store the storage path on the source, and pass it to the worker
  await updateSourceStoragePath(sourceId, storagePath);
  console.log("[upload] 8 storagePath", storagePath);
  console.log("[redis] URL Route:", process.env.REDIS_URL);
  await ingestionQueue.add("ingest-pdf", { sourceId, title, storagePath, userId });
  console.log("[upload] 9 queued");
  return NextResponse.json({ sourceId, status: "queued" });
}
