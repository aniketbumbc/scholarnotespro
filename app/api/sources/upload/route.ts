import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";
import { createSource } from "../../../src/models/source.model";
import { ingestionQueue } from "../../../src/queue/ingestion.queue";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const uploadDir = join(process.cwd(), "uploadspdf");

  await mkdir(uploadDir, { recursive: true });

  const filePath = join(uploadDir, `${randomUUID()}.pdf`);

  await writeFile(filePath, buf);

  const title = (form.get("title") as string) || file.name;
  const sourceId = await createSource({ title, sourceType: "pdf", filePath });

  await ingestionQueue.add("ingest-pdf", { sourceId, filePath, title });
  return NextResponse.json({ sourceId, status: "queued" });
}
