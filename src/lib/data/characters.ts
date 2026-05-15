import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assertNoSupabaseError } from "@/lib/supabase/errors";
import type { SeasonCharacter, SeasonCharacterInput } from "@/types";

function mapCharacter(row: Record<string, unknown>): SeasonCharacter {
  return {
    id: String(row.id),
    season: Number(row.season ?? 1),
    story_slug: String(row.story_slug ?? ""),
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    description: String(row.description ?? ""),
    published: Boolean(row.published),
    image_url: row.image_url ? String(row.image_url) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function matchesNovelCharacter(character: SeasonCharacter, storySlug: string, strict = false) {
  const slug = storySlug.trim();
  const characterSlug = character.story_slug.trim();

  if (!slug) {
    return strict ? false : characterSlug.length === 0;
  }

  if (strict) {
    return characterSlug === slug;
  }

  return characterSlug === slug || characterSlug.length === 0;
}

export async function listCharacters(options?: {
  includeUnpublished?: boolean;
  season?: number;
  storySlug?: string;
  strictStorySlug?: boolean;
}) {
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("season_characters")
    .select("*")
    .order("created_at", { ascending: true });

  if (!options?.includeUnpublished) {
    query = query.eq("published", true);
  }

  if (options?.season !== undefined) {
    query = query.eq("season", options.season);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  const characters = data.map(mapCharacter);
  if (options?.storySlug === undefined) {
    return characters;
  }

  return characters.filter((character) =>
    matchesNovelCharacter(character, options.storySlug!, options.strictStorySlug ?? false),
  );
}

export async function listCharactersForNovel(
  storySlug: string,
  season: number,
  options?: { includeUnpublished?: boolean; strict?: boolean },
) {
  return listCharacters({
    season,
    storySlug,
    includeUnpublished: options?.includeUnpublished ?? true,
    strictStorySlug: options?.strict ?? false,
  });
}

export async function seasonHasPublishedRecords(season: number, storySlug?: string) {
  const supabase = await createClient();
  if (!supabase) {
    return false;
  }

  let query = supabase
    .from("records")
    .select("id", { count: "exact", head: true })
    .eq("season", season)
    .eq("published", true);

  if (storySlug?.trim()) {
    query = query.eq("story_slug", storySlug.trim());
  }

  const { count, error } = await query;

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

export async function listPublicSeasonCharacters(season: number, storySlug?: string) {
  const launched = await seasonHasPublishedRecords(season, storySlug);
  if (!launched) {
    return [];
  }

  return listCharacters({ season, storySlug, includeUnpublished: false });
}

export async function copyProtagonistsToNovel(
  sourceStorySlug: string,
  targetStorySlug: string,
  season: number,
  sourceCharacterIds?: string[],
) {
  const source = sourceStorySlug.trim();
  const target = targetStorySlug.trim();
  if (!source || !target) {
    throw new Error("Indica la novela de origen y el nombre de la nueva novela.");
  }

  if (source === target) {
    throw new Error("La nueva novela debe tener un identificador distinto.");
  }

  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  let sourceCharacters = await listCharactersForNovel(source, season, {
    includeUnpublished: true,
    strict: false,
  });

  if (sourceCharacterIds?.length) {
    const idSet = new Set(sourceCharacterIds);
    sourceCharacters = sourceCharacters.filter((character) => idSet.has(character.id));
  }

  if (sourceCharacters.length === 0) {
    throw new Error("No hay protagonistas seleccionados para copiar.");
  }

  const existingTarget = await listCharactersForNovel(target, season, {
    includeUnpublished: true,
    strict: true,
  });
  const existingNames = new Set(existingTarget.map((character) => character.name.trim().toLowerCase()));

  const toInsert = sourceCharacters
    .filter((character) => !existingNames.has(character.name.trim().toLowerCase()))
    .map((character) => ({
      season,
      story_slug: target,
      name: character.name.trim(),
      role: character.role.trim(),
      description: character.description,
      published: false,
      image_url: character.image_url,
    }));

  if (toInsert.length === 0) {
    return { copied: 0, skipped: sourceCharacters.length };
  }

  const { error } = await supabase.from("season_characters").insert(toInsert);
  assertNoSupabaseError(error, "No se pudieron copiar los protagonistas.");

  return { copied: toInsert.length, skipped: sourceCharacters.length - toInsert.length };
}

export async function saveCharacter(input: SeasonCharacterInput & { id?: string }) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  const payload = {
    season: input.season,
    story_slug: input.story_slug.trim(),
    name: input.name.trim(),
    role: input.role.trim(),
    description: input.description,
    published: input.published,
    image_url: input.image_url,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("season_characters")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) throw error;
    return mapCharacter(data);
  }

  const { data, error } = await supabase
    .from("season_characters")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return mapCharacter(data);
}

export async function deleteCharacter(id: string) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  const { error } = await supabase.from("season_characters").delete().eq("id", id);
  if (error) throw error;
}

export async function setCharacterPublished(id: string, published: boolean) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  const { data, error } = await supabase
    .from("season_characters")
    .update({ published })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapCharacter(data);
}
