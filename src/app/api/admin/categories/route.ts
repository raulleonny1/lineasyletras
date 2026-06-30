import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/admin-session";
import { addCustomCategory } from "@/lib/firebase/categories";
import { normalizeCategoryName } from "@/lib/categories";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { name } = await request.json();
  const normalized = normalizeCategoryName(name ?? "");

  if (!normalized) {
    return NextResponse.json({ error: "Nombre de categoría inválido" }, { status: 400 });
  }

  const ok = await addCustomCategory(normalized);
  if (!ok) {
    return NextResponse.json(
      { error: "No se pudo guardar la categoría. Verifica Firebase." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, name: normalized });
}
