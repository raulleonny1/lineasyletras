export interface Story {
  id: string;
  title: string;
  author: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  readTime: string;
  date: string;
  color: string;
  /** Formato de la obra. Por defecto relato corto. */
  format?: import("@/types/story-format").StoryFormat;
  /** Estructura de capítulos y escenas (solo novelas). */
  novel?: import("@/types/story-format").NovelStructure;
  /** URL de portada recortada (Facebook, tarjetas). Opcional. */
  coverImageUrl?: string;
  published?: boolean;
  /** Destacada en la sección Premium del inicio */
  premium?: boolean;
  source?: "curated" | "admin" | "user";
  isUserCreated?: boolean;
  /** Historias de ejemplo del código; aún no están en Firebase */
  isExample?: boolean;
}

export type StoryInput = Omit<Story, "id" | "readTime" | "date"> & {
  readTime?: string;
  date?: string;
};

export type ActiveTab = "explorar" | "leer" | "favoritos";
export type ThemeMode = "light" | "sepia" | "dark";
export type FontSize = "text-base" | "text-lg" | "text-xl" | "text-2xl";
export type AiAssistantMode = "bosquejo" | "pulir" | "devocional";
