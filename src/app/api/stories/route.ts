import { NextResponse } from "next/server";
import { fetchAllStories, fetchPublishedStories } from "@/lib/firebase/stories";
import { INITIAL_STORIES } from "@/data/initial-stories";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isFirebaseConfigured()) {
    let stories = await fetchPublishedStories();

    if (stories.length === 0) {
      const all = await fetchAllStories();
      stories = all.filter((story) => story.published !== false);
    }

    if (stories.length > 0) {
      return NextResponse.json(
        { stories, source: "firebase" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  return NextResponse.json(
    {
      stories: INITIAL_STORIES.map((s) => ({ ...s, published: true, source: "curated" as const })),
      source: "seed",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
