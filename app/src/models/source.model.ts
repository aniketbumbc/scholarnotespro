import { randomUUID } from "crypto";
import { getDb as db } from "../config/mongo";
import { pineconeIndex } from "../config/pinecone";
import { deletePdf } from "../lib/storage";
import { getUserId } from "../lib/auth";

export type SourceStatus = "queued" | "processing" | "ready" | "failed";
export async function createSource(input: {
  title: string;
  sourceType: "pdf" | "youtube";
  userId: string; // user id
  filePath?: string; // pdf
  videoId?: string; // youtube
  playlistId?: string; // youtube, when part of a series
}) {
  const sourceId = randomUUID();
  await (await db()).collection("sources").insertOne({
    _id: sourceId as any,
    ...input,
    status: "queued",
    userId: input.userId,
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

export async function deleteSource(sourceId: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const src = await getOwnedSource(sourceId, userId);
  if (!src) return { error: "Source not found" };

  if (src?.sourceType === "pdf" && src.storagePath) {
    await deletePdf(src.storagePath); // ← clean up the file
  }

  // 1. Pinecone vectors — delete by metadata filter
  try {
    await pineconeIndex.deleteMany({ sourceId });
  } catch (e) {
    console.warn(`[delete] no vectors for ${sourceId}`);
  }

  // 2. Mongo chunks — parent text
  await (await db()).collection("chunks").deleteMany({ sourceId });

  // 3. Mongo sources — the record itself
  await (await db()).collection("sources").deleteOne({ _id: sourceId as any });

  return { sourceId, deleted: true };
}

export async function deletePlaylist(playlistId: string, userId: string) {
  // find every source in this playlist owned by this user
  const sources = await (await db()).collection("sources").find({ playlistId, userId }).toArray();
  if (sources.length === 0) return { playlistId, deletedCount: 0 };

  // delete each one (vectors + chunks + record) via the existing helper
  for (const s of sources) {
    await deleteSource(s._id as any);
  }

  return { playlistId, deletedCount: sources.length };
}

// returns the source if it belongs to userId, else null
export async function getOwnedSource(sourceId: string, userId: string) {
  const database = await db();
  const src = await database.collection("sources").findOne({ _id: sourceId as any });
  if (!src) return null;
  if (src.userId !== userId) return null; // exists but not yours → treat as not found
  return src;
}

export async function updateSourceStoragePath(sourceId: string, storagePath: string) {
  const database = await db();
  await database
    .collection("sources")
    .updateOne({ _id: sourceId as any }, { $set: { storagePath } });
}
