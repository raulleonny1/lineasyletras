import { DEFAULT_STORY_CATEGORIES } from "@/data/initial-stories";

export function getDefaultCategories(): string[] {
  return DEFAULT_STORY_CATEGORIES.filter((c) => c !== "Todas");
}

export function mergeCategories(...lists: (string | undefined)[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const list of lists) {
    for (const item of list) {
      const trimmed = item?.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      result.push(trimmed);
    }
  }

  return result.sort((a, b) => a.localeCompare(b, "es"));
}

export function categoriesForPublicFilter(categories: string[]): string[] {
  return ["Todas", ...categories];
}

export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
