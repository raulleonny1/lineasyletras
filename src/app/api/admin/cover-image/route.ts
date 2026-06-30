import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/admin-session";
import { saveStoryCover, removeCoverImage } from "@/lib/firebase/storage";
import { adminSdkGuard } from "@/lib/firebase/admin-sdk-guard";

function isAdmin(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sdkError = adminSdkGuard();
  if (sdkError) return sdkError;

  const form = await request.formData();
  const storyId = String(form.get("storyId") ?? "").trim();
  const file = form.get("file");

  if (!storyId) {
    return NextResponse.json({ error: "Falta el ID de la historia" }, { status: 400 });
  }
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona una imagen válida" }, { status: 400 });
  }
  if (file.size > 600 * 1024) {
    return NextResponse.json(
      { error: "La imagen recortada es demasiado grande. Intenta con otra foto." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/jpeg";

  try {
    const coverImageUrl = await saveStoryCover(storyId, buffer, contentType);
    return NextResponse.json({ coverImageUrl });
  } catch (error) {
    console.error("Error al guardar portada:", error);
    return NextResponse.json({ error: "No se pudo guardar la imagen." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sdkError = adminSdkGuard();
  if (sdkError) return sdkError;

  const storyId = request.nextUrl.searchParams.get("storyId")?.trim();
  if (!storyId) {
    return NextResponse.json({ error: "Falta el ID de la historia" }, { status: 400 });
  }

  await removeCoverImage(storyId);
  return NextResponse.json({ ok: true });
}
