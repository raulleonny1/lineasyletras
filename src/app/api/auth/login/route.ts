import { NextRequest, NextResponse } from "next/server";
import { adminSdkGuard } from "@/lib/firebase/admin-sdk-guard";
import { verifyPin } from "@/lib/auth/pin";
import {
  createUserSessionToken,
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
} from "@/lib/auth/user-session";
import { validateLoginInput } from "@/lib/auth/user-validation";
import { getUserByPin } from "@/lib/firebase/users";
import type { UserLoginInput } from "@/types/user";

export async function POST(request: NextRequest) {
  const sdkError = adminSdkGuard();
  if (sdkError) return sdkError;

  const body = (await request.json()) as UserLoginInput;
  const validationError = validateLoginInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const user = await getUserByPin(body.pin);
  if (!user || !verifyPin(body.pin, user.pinHash)) {
    return NextResponse.json({ error: "Código incorrecto. Intenta de nuevo." }, { status: 401 });
  }

  const { pinHash: _removed, ...profile } = user;
  const token = createUserSessionToken(profile.id);
  const response = NextResponse.json({ user: profile });
  response.cookies.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: USER_SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
