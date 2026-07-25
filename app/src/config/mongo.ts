import "dotenv/config";
import { MongoClient, Db } from "mongodb";

const g = globalThis as {
  mongoClient?: MongoClient;
  db?: Db;
};

export async function getDb(): Promise<Db> {
  if (g.db) return g.db;

  const client = new MongoClient(process.env.MONGO_URL!);
  await client.connect();

  g.mongoClient = client;
  g.db = client.db("scholarnotespro");

  return g.db;
}
