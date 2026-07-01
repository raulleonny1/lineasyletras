import type { Story, StoryInput } from "@/types/story";
import { STORY_COLORS } from "@/data/initial-stories";

export function computeReadTime(content: string): string {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min`;
}

export function parseTagsInput(raw: string): string[] {
  const tags = raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  return tags.length > 0 ? tags : ["Inspiración"];
}

export function pickRandomColor(): string {
  return STORY_COLORS[Math.floor(Math.random() * STORY_COLORS.length)];
}

export function buildStoryFromInput(input: StoryInput, id?: string): Story {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: id ?? Date.now().toString(),
    title: input.title.trim(),
    author: input.author.trim() || "Líneas y Letras",
    category: input.category,
    summary:
      input.summary.trim() ||
      input.content.trim().substring(0, 120) + (input.content.length > 120 ? "..." : ""),
    content: input.content.trim(),
    tags: input.tags,
    readTime: input.readTime ?? computeReadTime(input.content),
    date: input.date ?? today,
    color: input.color || pickRandomColor(),
    coverImageUrl: input.coverImageUrl,
    published: input.published ?? false,
    premium: input.premium ?? false,
    source: input.source ?? "admin",
  };
}

export function slugifyTag(tag: string): string {
  return encodeURIComponent(
    tag
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
  );
}

export function tagFromSlug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

export function storyMatchesTag(story: Story, tagQuery: string): boolean {
  const normalized = tagQuery.toLowerCase().trim();
  return story.tags.some((tag) => tag.toLowerCase() === normalized);
}

export function filterStories(
  stories: Story[],
  options: { search?: string; category?: string; tag?: string; publishedOnly?: boolean }
): Story[] {
  const { search = "", category = "Todas", tag, publishedOnly = true } = options;

  return stories.filter((story) => {
    if (publishedOnly && story.published === false) return false;

    const matchesSearch =
      !search ||
      story.title.toLowerCase().includes(search.toLowerCase()) ||
      story.content.toLowerCase().includes(search.toLowerCase()) ||
      story.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = category === "Todas" || story.category === category;
    const matchesTag = !tag || storyMatchesTag(story, tag);

    return matchesSearch && matchesCategory && matchesTag;
  });
}
