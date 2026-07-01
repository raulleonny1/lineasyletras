import { NextRequest, NextResponse } from "next/server";
import { parseUserSessionToken } from "@/lib/auth/user-session";
import { getUserById } from "@/lib/firebase/users";
import { createStory, fetchStoriesByAuthorId } from "@/lib/firebase/stories";
import { computeReadTime, parseTagsInput } from "@/lib/stories/utils";
import type { StoryInput } from "@/types/story";

export async function GET(request: NextRequest) {
  const userId = parseUserSessionToken(request.cookies.get("lyl_user_session")?.value);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const stories = await fetchStoriesByAuthorId(userId);
  return NextResponse.json({ stories });
}

export async function POST(request: NextRequest) {
  const userId = parseUserSessionToken(request.cookies.get("lyl_user_session")?.value);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  let body: Partial<StoryInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const title = body.title?.trim();
  const content = body.content?.trim();
  if (!title || !content) {
    return NextResponse.json({ error: "Título y contenido son obligatorios" }, { status: 400 });
  }

  const authorName = `${user.firstName} ${user.lastName}`.trim();
  const tags = Array.isArray(body.tags) ? body.tags : parseTagsInput(String(body.tags ?? ""));

  const created = await createStory({
    title,
    author: body.author?.trim() || authorName,
    category: body.category?.trim() || "Fe y Esperanza",
    summary: body.summary?.trim() || "",
    content,
    tags,
    color: body.color || "from-indigo-500 to-purple-600",
    published: false,
    premium: false,
    source: "user",
    readTime: computeReadTime(content),
    authorId: userId,
  });

  if (!created) {
    return NextResponse.json({ error: "No se pudo guardar la historia" }, { status: 500 });
  }

  return NextResponse.json({ story: created });
}
