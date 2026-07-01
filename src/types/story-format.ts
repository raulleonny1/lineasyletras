export type StoryFormat = "relato_corto" | "historia_corta" | "novela";

export interface NovelScene {
  id: string;
  title: string;
  content: string;
}

export interface NovelChapter {
  id: string;
  title: string;
  scenes: NovelScene[];
}

export interface NovelStructure {
  chapters: NovelChapter[];
}

export const STORY_FORMAT_OPTIONS: {
  value: StoryFormat;
  label: string;
  description: string;
}[] = [
  {
    value: "relato_corto",
    label: "Relato corto",
    description: "Narración breve en un solo bloque de texto.",
  },
  {
    value: "historia_corta",
    label: "Historia corta",
    description: "Texto único, ideal para reflexiones y lecturas rápidas.",
  },
  {
    value: "novela",
    label: "Novela",
    description: "Obra continuada por capítulos y escenas. Puedes ir publicando nuevas partes.",
  },
];

export function isNovelContinued(story: {
  format?: StoryFormat;
  novelContinued?: boolean;
}): boolean {
  return story.format === "novela" && story.novelContinued !== false;
}

export function novelContinuityLabel(story: {
  format?: StoryFormat;
  novelContinued?: boolean;
}): string {
  if (story.format !== "novela") return "";
  return isNovelContinued(story) ? "Novela continuada" : "Novela completa";
}

export function formatLabel(format?: StoryFormat): string {
  return STORY_FORMAT_OPTIONS.find((o) => o.value === (format ?? "relato_corto"))?.label ?? "Relato corto";
}
