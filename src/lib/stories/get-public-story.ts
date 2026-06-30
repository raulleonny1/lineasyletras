import { INITIAL_STORIES } from "@/data/initial-stories";
import { fetchStoryById } from "@/lib/firebase/stories";
import type { Story } from "@/types/story";

/** Historia publicada por ID (Firebase o ejemplos locales). */
export async function getPublicStory(id: string): Promise<Story | null> {
  let story = await fetchStoryById(id);

  if (!story) {
    const example = INITIAL_STORIES.find((s) => s.id === id);
    if (example) {
      story = { ...example, published: true, source: "curated" };
    }
  }

  if (!story || story.published === false) return null;
  return story;
}
