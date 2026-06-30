import { NextResponse } from "next/server";
import { fetchPublishedStories } from "@/lib/firebase/stories";
import { INITIAL_STORIES } from "@/data/initial-stories";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export async function GET() {
  if (isFirebaseConfigured()) {
    const stories = await fetchPublishedStories();
    if (stories.length > 0) {
      return NextResponse.json({ stories, source: "firebase" });
    }
  }

  return NextResponse.json({
    stories: INITIAL_STORIES.map((s) => ({ ...s, published: true, source: "curated" as const })),
    source: "seed",
  });
}
