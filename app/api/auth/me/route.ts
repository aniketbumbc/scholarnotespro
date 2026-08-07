import { NextResponse } from "next/server";
import { getUserId } from "../../../src/lib/auth";
import { findUserById } from "../../../src/models/user.model";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await findUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: user._id, email: user.email, name: user.name },
  });
}
