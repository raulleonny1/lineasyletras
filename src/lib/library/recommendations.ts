import type { Story } from "@/types/story";
import type { ReadingEntry } from "@/types/user-library";

function storySortKey(story: Story): string {
  return `${story.premium ? "0" : "1"}:${story.date || ""}:${story.id}`;
}

function byCatalogOrder(a: Story, b: Story): number {
  return storySortKey(a).localeCompare(storySortKey(b));
}

/**
 * Elige la siguiente historia recomendada:
 * 1. Misma categoría que la última leída (si hay)
 * 2. Premium sin leer
 * 3. Primera del catálogo por fecha / premium
 */
export function pickRecommendedStory(
  allStories: Story[],
  readEntries: ReadingEntry[]
): Story | null {
  const readIds = new Set(readEntries.map((e) => e.storyId));
  const unread = allStories.filter((s) => !readIds.has(s.id));
  if (unread.length === 0) return null;

  if (readEntries.length > 0) {
    const lastRead = [...readEntries].sort((a, b) => b.readAt.localeCompare(a.readAt))[0];
    const lastStory = allStories.find((s) => s.id === lastRead.storyId);
    if (lastStory) {
      const sameCategory = unread
        .filter((s) => s.category === lastStory.category)
        .sort(byCatalogOrder);
      if (sameCategory.length > 0) return sameCategory[0];
    }
  }

  const premiumUnread = unread.filter((s) => s.premium).sort(byCatalogOrder);
  if (premiumUnread.length > 0) return premiumUnread[0];

  const sorted = [...unread].sort(byCatalogOrder);
  return sorted[0] ?? null;
}

export function partitionLibraryStories(
  allStories: Story[],
  readEntries: ReadingEntry[]
): { readStories: Story[]; unreadStories: Story[] } {
  const readMap = new Map(readEntries.map((e) => [e.storyId, e.readAt]));
  const readStories: Story[] = [];
  const unreadStories: Story[] = [];

  for (const story of allStories) {
    if (readMap.has(story.id)) {
      readStories.push(story);
    } else {
      unreadStories.push(story);
    }
  }

  readStories.sort((a, b) => (readMap.get(b.id) ?? "").localeCompare(readMap.get(a.id) ?? ""));
  unreadStories.sort(byCatalogOrder);

  return { readStories, unreadStories };
}
