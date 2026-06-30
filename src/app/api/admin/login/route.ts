import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  createSessionToken,
  COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth/admin-session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
