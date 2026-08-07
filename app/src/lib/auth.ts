import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

// returns userId if the request has a valid token, else null
export async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload.userId ?? null;
  } catch {
    // invalid/expired token → treated as not logged in
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return userId;
}
