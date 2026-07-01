import type { StoryFormat, NovelChapter } from "@/types/story-format";
import type { StoryInput } from "@/types/story";
import {
  flattenNovelToContent,
  isNovelFormat,
  novelHasContent,
  normalizeNovelChapters,
  createEmptyChapter,
} from "@/lib/stories/novel";

export function validateStoryBody(input: {
  format?: StoryFormat;
  content?: string;
  novel?: { chapters: NovelChapter[] };
}): string | null {
  const format = input.format ?? "relato_corto";

  if (isNovelFormat(format)) {
    const chapters = input.novel?.chapters ?? [];
    if (!novelHasContent(chapters)) {
      return "Añade al menos una escena con contenido en tu novela.";
    }
    return null;
  }

  if (!input.content?.trim()) {
    return "El contenido es obligatorio.";
  }
  return null;
}

export function buildStoryPayloadFields(input: {
  format?: StoryFormat;
  content?: string;
  novel?: { chapters: NovelChapter[] };
}): Pick<StoryInput, "format" | "content" | "novel"> {
  const format = input.format ?? "relato_corto";

  if (isNovelFormat(format)) {
    const chapters = normalizeNovelChapters(
      input.novel?.chapters?.length ? input.novel.chapters : [createEmptyChapter()]
    );
    return {
      format: "novela",
      novel: { chapters },
      content: flattenNovelToContent(chapters),
    };
  }

  return {
    format,
    content: (input.content ?? "").trim(),
    novel: undefined,
  };
}

export function initialNovelChaptersFromStory(
  format?: StoryFormat,
  novel?: { chapters: NovelChapter[] }
): NovelChapter[] {
  if (isNovelFormat(format) && novel?.chapters?.length) {
    return normalizeNovelChapters(novel.chapters);
  }
  return [createEmptyChapter()];
}
