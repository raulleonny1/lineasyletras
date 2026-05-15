import { NextResponse } from "next/server";
import { activateAccountWithoutEmail } from "@/lib/auth/local-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Correo y contraseña son obligatorios." }, { status: 400 });
    }

    await activateAccountWithoutEmail(email, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo activar la cuenta.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
