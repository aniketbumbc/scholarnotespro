import { NextResponse } from "next/server";
import { pineconeIndex } from "../../src/config/pinecone";
import { getDb as db } from "../../src/config/mongo";

export async function DELETE() {
  let pineconeOk = true;
  try {
    await pineconeIndex.deleteAll();
  } catch (e) {
    pineconeOk = false;
    console.error("[delete-all] pinecone:", (e as Error).message);
  }

  const chunks = await (await db()).collection("chunks").deleteMany({});
  const sources = await (await db()).collection("sources").deleteMany({});

  return NextResponse.json({
    deletedAll: true,
    pineconeCleared: pineconeOk,
    chunksDeleted: chunks.deletedCount,
    sourcesDeleted: sources.deletedCount,
  });
}
