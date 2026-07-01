import { NextRequest, NextResponse } from "next/server";
import { parseUserSessionToken } from "@/lib/auth/user-session";
import { markStoryRead } from "@/lib/firebase/user-library";

export async function POST(request: NextRequest) {
  const userId = parseUserSessionToken(request.cookies.get("lyl_user_session")?.value);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { storyId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const storyId = body.storyId?.trim();
  if (!storyId) {
    return NextResponse.json({ error: "storyId requerido" }, { status: 400 });
  }

  const entry = await markStoryRead(userId, storyId);
  if (!entry) {
    return NextResponse.json({ error: "No se pudo guardar el progreso" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, entry });
}
