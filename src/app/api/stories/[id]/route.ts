import { NextResponse } from "next/server";
import { getPublicStory } from "@/lib/stories/get-public-story";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await getPublicStory(id);

  if (!story) {
    return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ story });
}
