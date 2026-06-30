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
  /** URL de portada recortada (Facebook, tarjetas). Opcional. */
  coverImageUrl?: string;
  published?: boolean;
  source?: "curated" | "admin" | "user";
  isUserCreated?: boolean;
  /** Historias de ejemplo del código; aún no están en Firebase */
  isExample?: boolean;
}

export type StoryInput = Omit<Story, "id" | "readTime" | "date"> & {
  readTime?: string;
  date?: string;
};

export type ActiveTab = "explorar" | "leer" | "asistente" | "favoritos";
export type ThemeMode = "light" | "sepia" | "dark";
export type FontSize = "text-base" | "text-lg" | "text-xl" | "text-2xl";
export type AiAssistantMode = "bosquejo" | "pulir" | "devocional";
