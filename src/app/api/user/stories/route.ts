import { NextRequest, NextResponse } from "next/server";
import { parseUserSessionToken } from "@/lib/auth/user-session";
import { getUserById } from "@/lib/firebase/users";
import { createStory, fetchStoriesByAuthorId } from "@/lib/firebase/stories";
import { computeReadTimeFromInput, parseTagsInput } from "@/lib/stories/utils";
import { validateStoryBody, buildStoryPayloadFields } from "@/lib/stories/story-body";
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
  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const bodyError = validateStoryBody({
    format: body.format,
    content: body.content,
    novel: body.novel,
  });
  if (bodyError) {
    return NextResponse.json({ error: bodyError }, { status: 400 });
  }

  const bodyFields = buildStoryPayloadFields({
    format: body.format,
    content: body.content,
    novel: body.novel,
  });

  const authorName = `${user.firstName} ${user.lastName}`.trim();
  const tags = Array.isArray(body.tags) ? body.tags : parseTagsInput(String(body.tags ?? ""));

  const created = await createStory({
    title,
    author: body.author?.trim() || authorName,
    category: body.category?.trim() || "Fe y Esperanza",
    summary: body.summary?.trim() || "",
    ...bodyFields,
    tags,
    color: body.color || "from-indigo-500 to-purple-600",
    published: false,
    premium: false,
    source: "user",
    readTime: computeReadTimeFromInput({
      title,
      author: authorName,
      category: body.category?.trim() || "Fe y Esperanza",
      summary: body.summary?.trim() || "",
      tags,
      color: body.color || "from-indigo-500 to-purple-600",
      ...bodyFields,
    }),
    authorId: userId,
  });

  if (!created) {
    return NextResponse.json({ error: "No se pudo guardar la historia" }, { status: 500 });
  }

  return NextResponse.json({ story: created });
}
