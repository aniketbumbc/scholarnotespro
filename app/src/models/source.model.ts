import { randomUUID } from "crypto";
import { getDb as db } from "../config/mongo";

export type SourceStatus = "queued" | "processing" | "ready" | "failed";

export async function createSource(input: {
  title: string;
  sourceType: "pdf" | "youtube";
  filePath?: string;
}) {
  const sourceId = randomUUID();
  await (await db()).collection("sources").insertOne({
    _id: sourceId as any,
    ...input,
    status: "queued" as SourceStatus,
    createdAt: new Date(),
  });
  return sourceId;
}

export async function setSourceStatus(
  sourceId: string,
  status: SourceStatus,
  extra: Record<string, unknown> = {}
) {
  await (
    await db()
  )
    .collection("sources")
    .updateOne({ _id: sourceId as any }, { $set: { status, updatedAt: new Date(), ...extra } });
}
