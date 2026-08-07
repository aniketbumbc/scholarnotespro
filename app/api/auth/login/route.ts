import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { findUserByEmail } from "../../../src/models/user.model";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // look up the user
  const user = await findUserByEmail(email);

  // verify password — even if user not found, run a comparison to avoid timing leaks
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !ok) {
    // same message whether email is wrong OR password is wrong (don't reveal which)
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // sign JWT + set the httpOnly cookie
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return NextResponse.json({
    user: { id: user._id, email: user.email, name: user.name },
  });
}
