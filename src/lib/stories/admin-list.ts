import { INITIAL_STORIES } from "@/data/initial-stories";
import { fetchAllStories } from "@/lib/firebase/stories";
import type { Story } from "@/types/story";

export type AdminStoriesResult = {
  stories: Story[];
  hasExamplesOnly: boolean;
  firebaseCount: number;
};

export function getExampleStories(): Story[] {
  return INITIAL_STORIES.map((story) => ({
    ...story,
    published: true,
    source: "curated" as const,
    isExample: true,
  }));
}

export async function getAdminStoryList(): Promise<AdminStoriesResult> {
  const firebaseStories = await fetchAllStories();

  if (firebaseStories.length > 0) {
    return {
      stories: firebaseStories,
      hasExamplesOnly: false,
      firebaseCount: firebaseStories.length,
    };
  }

  return {
    stories: getExampleStories(),
    hasExamplesOnly: true,
    firebaseCount: 0,
  };
}
