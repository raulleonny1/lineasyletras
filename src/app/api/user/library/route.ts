import { NextRequest, NextResponse } from "next/server";
import { parseUserSessionToken } from "@/lib/auth/user-session";
import { getUserReadingEntries } from "@/lib/firebase/user-library";
import { fetchPublishedStories, fetchStoriesByAuthorId } from "@/lib/firebase/stories";
import { INITIAL_STORIES } from "@/data/initial-stories";
import { partitionLibraryStories, pickRecommendedStory } from "@/lib/library/recommendations";
import type { Story } from "@/types/story";

function mergePublished(published: Story[]): Story[] {
  return published.length > 0 ? published : INITIAL_STORIES;
}

export async function GET(request: NextRequest) {
  const userId = parseUserSessionToken(request.cookies.get("lyl_user_session")?.value);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [published, readEntries, myStories] = await Promise.all([
    fetchPublishedStories(),
    getUserReadingEntries(userId),
    fetchStoriesByAuthorId(userId),
  ]);

  const catalog = mergePublished(published);
  const { readStories, unreadStories } = partitionLibraryStories(catalog, readEntries);
  const recommended = pickRecommendedStory(catalog, readEntries);

  return NextResponse.json({
    read: readEntries,
    readStories,
    unreadStories,
    recommended,
    myStories,
    stats: {
      total: catalog.length,
      readCount: readStories.length,
      unreadCount: unreadStories.length,
    },
  });
}
