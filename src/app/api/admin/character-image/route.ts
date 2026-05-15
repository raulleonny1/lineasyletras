import { NextResponse } from "next/server";
import { isStaffRole } from "@/lib/auth/roles";
import { getCurrentUserProfile } from "@/lib/data/users";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function sanitizePathSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const profile = await getCurrentUserProfile();
  if (!profile || !isStaffRole(profile.role)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase no está configurado." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const characterId = String(formData.get("characterId") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Falta el archivo de retrato." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "El retrato debe ser JPG, PNG o WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "El retrato no puede superar 5 MB." },
      { status: 400 },
    );
  }

  const folder = sanitizePathSegment(
    characterId || (season && name ? `${season}-${name}` : name || "borrador"),
  );
  if (!folder) {
    return NextResponse.json(
      { ok: false, error: "Indica el nombre del personaje o guárdalo antes de subir el retrato." },
      { status: 400 },
    );
  }

  const extension = ALLOWED_TYPES.get(file.type)!;
  const path = `${folder}/portrait.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("character-portraits").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
    cacheControl: "3600",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("character-portraits").getPublicUrl(path);

  return NextResponse.json({ ok: true, url: data.publicUrl });
}
