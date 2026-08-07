import { randomUUID } from "node:crypto";
import { getDb as db } from "../config/mongo"; // adjust to your actual mongo export

export interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
}

// call once at startup (or manually) to enforce unique emails
export async function ensureUserIndexes() {
  const database = await db(); // adjust if your db isn't a function
  await database.collection<UserDoc>("users").createIndex({ email: 1 }, { unique: true });
}

// create a new user — expects an ALREADY-hashed password
export async function createUser(
  email: string,
  passwordHash: string,
  name?: string
): Promise<UserDoc> {
  const database = await db();
  const user: UserDoc = {
    _id: randomUUID(),
    email: email.trim().toLowerCase(), // normalize
    passwordHash,
    name,
    createdAt: new Date(),
  };
  await database.collection<UserDoc>("users").insertOne(user as any);
  return user;
}

// find by email (for login) — normalized lookup
export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const database = await db();
  return database.collection<UserDoc>("users").findOne({ email: email.trim().toLowerCase() });
}

// find by id (for /api/me and ownership checks)
export async function findUserById(userId: string): Promise<UserDoc | null> {
  const database = await db();
  return database.collection<UserDoc>("users").findOne({ _id: userId as any });
}
