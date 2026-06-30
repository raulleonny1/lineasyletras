import { NextResponse } from "next/server";
import { fetchStoryById } from "@/lib/firebase/stories";
import { INITIAL_STORIES } from "@/data/initial-stories";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let story = await fetchStoryById(id);

  if (!story) {
    const example = INITIAL_STORIES.find((s) => s.id === id);
    if (example) {
      story = { ...example, published: true, source: "curated" };
    }
  }

  if (!story || story.published === false) {
    return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ story });
}
