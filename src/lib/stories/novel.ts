import type { NovelChapter, NovelScene, StoryFormat } from "@/types/story-format";
import type { Story } from "@/types/story";

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyScene(): NovelScene {
  return { id: createId("scene"), title: "", content: "" };
}

export function createEmptyChapter(): NovelChapter {
  return { id: createId("chapter"), title: "", scenes: [createEmptyScene()] };
}

export function isNovelFormat(format?: StoryFormat): boolean {
  return format === "novela";
}

export function isNovelStory(story: Pick<Story, "format" | "novel">): boolean {
  return isNovelFormat(story.format) && Boolean(story.novel?.chapters?.length);
}

export function flattenNovelToContent(chapters: NovelChapter[]): string {
  return chapters
    .map((chapter) => {
      const parts: string[] = [];
      if (chapter.title.trim()) parts.push(chapter.title.trim());
      for (const scene of chapter.scenes) {
        if (scene.title.trim()) parts.push(scene.title.trim());
        if (scene.content.trim()) parts.push(scene.content.trim());
      }
      return parts.join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function novelHasContent(chapters: NovelChapter[]): boolean {
  return chapters.some((chapter) =>
    chapter.scenes.some((scene) => scene.title.trim() || scene.content.trim())
  );
}

export function computeNovelWordCount(chapters: NovelChapter[]): number {
  return chapters
    .flatMap((c) => c.scenes)
    .reduce((sum, scene) => sum + scene.content.trim().split(/\s+/).filter(Boolean).length, 0);
}

export function getStoryReadableText(story: Pick<Story, "content" | "format" | "novel">): string {
  if (isNovelStory(story) && story.novel) {
    return flattenNovelToContent(story.novel.chapters);
  }
  return story.content;
}

export function normalizeNovelChapters(chapters: NovelChapter[]): NovelChapter[] {
  return chapters.map((chapter) => ({
    id: chapter.id || createId("chapter"),
    title: chapter.title ?? "",
    scenes: (chapter.scenes?.length ? chapter.scenes : [createEmptyScene()]).map((scene) => ({
      id: scene.id || createId("scene"),
      title: scene.title ?? "",
      content: scene.content ?? "",
    })),
  }));
}
