import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/admin-session";
import { adminSdkGuard } from "@/lib/firebase/admin-sdk-guard";
import { ADMIN_SDK_REQUIRED_MESSAGE } from "@/lib/firebase/admin-sdk-message";
import {
  fetchAllStories,
  createStory,
  seedStories,
} from "@/lib/firebase/stories";
import { getAdminStoryList } from "@/lib/stories/admin-list";
import { INITIAL_STORIES } from "@/data/initial-stories";
import type { StoryInput } from "@/types/story";
import { validateStoryBody } from "@/lib/stories/story-body";

function isAdmin(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await getAdminStoryList();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sdkError = adminSdkGuard();
  if (sdkError) return sdkError;

  const body = await request.json();

  if (body.action === "seed") {
    const existing = await fetchAllStories();
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Ya hay historias en Firebase. No se puede volver a sembrar." },
        { status: 400 }
      );
    }
    const count = await seedStories(
      INITIAL_STORIES.map((s) => ({ ...s, published: true, source: "curated" }))
    );
    if (count === 0) {
      return NextResponse.json(
        { error: ADMIN_SDK_REQUIRED_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, count });
  }

  const input = body as StoryInput;
  if (!input.title?.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  const bodyError = validateStoryBody({
    format: input.format,
    content: input.content,
    novel: input.novel,
  });
  if (bodyError) {
    return NextResponse.json({ error: bodyError }, { status: 400 });
  }

  const story = await createStory({
    ...input,
    source: "admin",
    published: input.published ?? false,
  });

  if (!story) {
    return NextResponse.json(
      { error: "Error al crear la historia. Revisa la consola del servidor." },
      { status: 500 }
    );
  }

  return NextResponse.json({ story }, { status: 201 });
}
