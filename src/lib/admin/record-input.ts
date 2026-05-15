import type { RecordInput } from "@/types";

export function slugifyTitle(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeTag(tag: string) {
  return slugifyTitle(tag.replace(/^#+/, ""));
}

export function parseTagsInput(input: string) {
  const tags = input
    .split(/[,\s#]+/)
    .map((tag) => normalizeTag(tag))
    .filter(Boolean);

  return [...new Set(tags)];
}

export function formatTagsInput(tags: string[]) {
  return tags.map((tag) => `#${tag}`).join(" ");
}

export function validateRecordInput(input: RecordInput) {
  if (!input.title.trim()) {
    throw new Error("El título del capítulo o episodio es obligatorio.");
  }

  if (!input.slug.trim()) {
    throw new Error("El slug es obligatorio.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim())) {
    throw new Error("El slug solo puede usar minúsculas, números y guiones.");
  }

  if (!Number.isFinite(input.season) || input.season < 1) {
    throw new Error("La temporada debe ser mayor que cero.");
  }

  if (!Number.isFinite(input.episode) || input.episode < 1) {
    throw new Error("El episodio debe ser mayor que cero.");
  }

  if (input.season_title.length > 160) {
    throw new Error("El título de la temporada no puede superar 160 caracteres.");
  }

  if (input.story_title.length > 160) {
    throw new Error("El nombre de la novela no puede superar 160 caracteres.");
  }

  if (input.story_slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.story_slug.trim())) {
    throw new Error("El identificador de la novela solo puede usar minúsculas, números y guiones.");
  }

  for (const tag of input.tags) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) {
      throw new Error("Las etiquetas solo pueden usar minúsculas, números y guiones.");
    }
  }

  if (input.cover_url && !/^https?:\/\//.test(input.cover_url.trim())) {
    throw new Error("La portada debe ser una URL válida.");
  }
}
