import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { createUser, findUserByEmail } from "../../../src/models/user.model";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  // --- validation ---
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // --- duplicate check ---
  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // --- hash + create ---
  const passwordHash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await createUser(email, passwordHash, name);
  } catch (e: any) {
    // unique-index race: two signups with same email at once
    if (e?.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    throw e;
  }

  // --- auto-login: sign JWT + set httpOnly cookie ---
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

  const cookieStore = await cookies(); // Next 15/16: cookies() is async
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return NextResponse.json({
    user: { id: user._id, email: user.email, name: user.name },
  });
}
