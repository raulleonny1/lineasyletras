import { NextRequest, NextResponse } from "next/server";
import { adminSdkGuard } from "@/lib/firebase/admin-sdk-guard";
import {
  createUserSessionToken,
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
} from "@/lib/auth/user-session";
import { validateRegistrationInput } from "@/lib/auth/user-validation";
import { createUser } from "@/lib/firebase/users";
import type { UserRegistrationInput } from "@/types/user";

export async function POST(request: NextRequest) {
  const sdkError = adminSdkGuard();
  if (sdkError) return sdkError;

  const body = (await request.json()) as UserRegistrationInput;
  const validationError = validateRegistrationInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const user = await createUser(body);
    if (!user) {
      return NextResponse.json({ error: "No se pudo crear la cuenta." }, { status: 500 });
    }

    const token = createUserSessionToken(user.id);
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: USER_SESSION_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "MOBILE_EXISTS") {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este número móvil." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "PIN_EXISTS") {
      return NextResponse.json(
        { error: "Ese código de 4 dígitos ya está en uso. Elige otro." },
        { status: 409 }
      );
    }
    console.error("Error al registrar usuario:", error);
    return NextResponse.json({ error: "No se pudo crear la cuenta." }, { status: 500 });
  }
}
