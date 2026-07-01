import { NextRequest, NextResponse } from "next/server";
import { parseUserSessionToken } from "@/lib/auth/user-session";
import { getUserById } from "@/lib/firebase/users";

export async function GET(request: NextRequest) {
  const userId = parseUserSessionToken(request.cookies.get("lyl_user_session")?.value);
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
