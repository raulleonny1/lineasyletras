import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/admin-session";
import { isAdminSdkConfigured } from "@/lib/firebase/admin";
import { ADMIN_SDK_REQUIRED_MESSAGE } from "@/lib/firebase/admin-sdk-message";
import { fetchStoryById, updateStory, deleteStory } from "@/lib/firebase/stories";
import type { StoryInput } from "@/types/story";

function isAdmin(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

function adminSdkGuard() {
  if (!isAdminSdkConfigured()) {
    return NextResponse.json({ error: ADMIN_SDK_REQUIRED_MESSAGE }, { status: 503 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const story = await fetchStoryById(id);
  if (!story) {
    return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ story });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sdkError = adminSdkGuard();
  if (sdkError) return sdkError;

  const { id } = await params;
  const input = (await request.json()) as Partial<StoryInput>;
  const ok = await updateStory(id, input);

  if (!ok) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }

  const story = await fetchStoryById(id);
  return NextResponse.json({ story });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sdkError = adminSdkGuard();
  if (sdkError) return sdkError;

  const { id } = await params;
  const ok = await deleteStory(id);

  if (!ok) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
