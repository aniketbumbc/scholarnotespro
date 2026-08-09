import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_BUCKET!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl!, serviceKey!);

// Supabase Storage keys reject some characters — keep the rest of the original name intact
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// upload a PDF buffer, return its storage path
export async function uploadPdf(
  sourceId: string,
  fileName: string,
  buffer: Buffer
): Promise<string> {
  const path = `${sourceId}/${sanitizeFileName(fileName)}`; // folder per source, real filename inside
  console.log("[uploadPdf] 1 path", path);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    console.error("[uploadPdf] 2 error", error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return path;
}

// download a PDF as a Buffer (for the worker to extract)
export async function downloadPdf(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message}`);
  return Buffer.from(await data.arrayBuffer());
}

// delete a PDF (when the source is deleted)
export async function deletePdf(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
