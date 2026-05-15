import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assertNoSupabaseError, isMissingCreatedByColumn } from "@/lib/supabase/errors";
import { getSeedRecordById, getSeedRecords } from "@/lib/data/seed-records";
import { normalizeTag, slugifyTitle } from "@/lib/admin/record-input";
import { compareRecordsBySeasonEpisode } from "@/lib/records";
import type { AdminRecord, AdminRecordOwner, ArchivumRecord, CarouselNovel, RecordInput } from "@/types";

function isSeedRecordId(id: string) {
  return id.startsWith("rec-");
}

function buildRecordPayload(
  catalog: ArchivumRecord,
  overrides: Partial<RecordInput> = {},
): RecordInput {
  return {
    title: overrides.title ?? catalog.title,
    slug: overrides.slug ?? catalog.slug,
    synopsis: overrides.synopsis ?? catalog.synopsis,
    content: overrides.content ?? catalog.content,
    season: overrides.season ?? catalog.season,
    episode: overrides.episode ?? catalog.episode,
    story_title: overrides.story_title ?? catalog.story_title,
    story_slug: overrides.story_slug ?? catalog.story_slug,
    season_title: overrides.season_title ?? catalog.season_title,
    is_premium:
      overrides.is_premium !== undefined ? overrides.is_premium : catalog.is_premium,
    published: overrides.published !== undefined ? overrides.published : catalog.published,
    featured: overrides.featured !== undefined ? overrides.featured : catalog.featured,
    tags: overrides.tags ?? catalog.tags,
    cover_url:
      overrides.cover_url !== undefined ? overrides.cover_url : catalog.cover_url,
  };
}

async function findPersistedRecordId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  id: string,
  slug: string,
) {
  if (!isSeedRecordId(id)) {
    const { data: byId } = await supabase.from("records").select("id").eq("id", id).maybeSingle();
    if (byId) {
      return String(byId.id);
    }
  }

  const { data: bySlug } = await supabase.from("records").select("id").eq("slug", slug).maybeSingle();
  return bySlug ? String(bySlug.id) : null;
}

function mapRecord(row: Record<string, unknown>): ArchivumRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    synopsis: String(row.synopsis ?? ""),
    content: String(row.content ?? ""),
    season: Number(row.season ?? 1),
    episode: Number(row.episode ?? 1),
    story_title: String(row.story_title ?? ""),
    story_slug: String(row.story_slug ?? ""),
    season_title: String(row.season_title ?? ""),
    is_premium: Boolean(row.is_premium),
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
    cover_url: row.cover_url ? String(row.cover_url) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapAdminRecord(
  row: Record<string, unknown>,
  ownerById: Map<string, AdminRecordOwner>,
): AdminRecord {
  const createdBy = row.created_by ? String(row.created_by) : null;

  return {
    ...mapRecord(row),
    created_by: createdBy,
    owner: createdBy ? ownerById.get(createdBy) ?? null : null,
  };
}

function toCatalogAdminRecord(record: ArchivumRecord): AdminRecord {
  return {
    ...record,
    created_by: null,
    owner: null,
  };
}

function sortRecordsBySeasonEpisode(records: ArchivumRecord[]) {
  return [...records].sort(compareRecordsBySeasonEpisode);
}

export async function listRecords(options?: {
  includeUnpublished?: boolean;
  featuredOnly?: boolean;
  fallbackToSeed?: boolean;
  tag?: string;
}) {
  const supabase = await createClient();
  const fallbackToSeed = options?.fallbackToSeed ?? true;
  const normalizedTag = options?.tag ? normalizeTag(options.tag) : undefined;

  if (!supabase) {
    return sortRecordsBySeasonEpisode(filterRecordsByTag(getSeedRecords(options), normalizedTag));
  }

  let query = supabase
    .from("records")
    .select("*")
    .order("season", { ascending: true })
    .order("episode", { ascending: true });

  if (!options?.includeUnpublished) {
    query = query.eq("published", true);
  }

  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }

  if (normalizedTag) {
    query = query.contains("tags", [normalizedTag]);
  }

  const { data, error } = await query;

  if (error) {
    if (!fallbackToSeed) {
      return [];
    }

    return sortRecordsBySeasonEpisode(filterRecordsByTag(getSeedRecords(options), normalizedTag));
  }

  if (!data?.length) {
    if (!fallbackToSeed) {
      return [];
    }

    return sortRecordsBySeasonEpisode(filterRecordsByTag(getSeedRecords(options), normalizedTag));
  }

  return sortRecordsBySeasonEpisode(data.map(mapRecord));
}

function filterRecordsByTag(records: ArchivumRecord[], tag?: string) {
  if (!tag) {
    return records;
  }

  return records.filter((record) => record.tags.includes(tag));
}

export async function listPublishedTags() {
  const records = await listRecords();
  const tags = new Set<string>();

  for (const record of records) {
    for (const tag of record.tags) {
      tags.add(tag);
    }
  }

  return Array.from(tags).sort();
}

export async function listAdminRecords(): Promise<AdminRecord[]> {
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) {
    return getSeedRecords({ includeUnpublished: true }).map(toCatalogAdminRecord);
  }

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .order("season", { ascending: true })
    .order("episode", { ascending: true });

  let dbRecords: AdminRecord[] = [];
  if (error) {
    throw new Error(`No se pudieron cargar los relatos: ${error.message}`);
  }

  if (data?.length) {
    const ownerIds = [
      ...new Set(
        data
          .map((row) => (row.created_by ? String(row.created_by) : null))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const ownerById = new Map<string, AdminRecordOwner>();

    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from("users")
        .select("id, email, name, role")
        .in("id", ownerIds);

      for (const owner of owners ?? []) {
        ownerById.set(String(owner.id), {
          id: String(owner.id),
          email: String(owner.email),
          name: owner.name ? String(owner.name) : null,
          role: owner.role as AdminRecordOwner["role"],
        });
      }
    }

    dbRecords = data.map((row) => mapAdminRecord(row, ownerById));
  }

  const seedRecords = getSeedRecords({ includeUnpublished: true });
  const dbSlugs = new Set(dbRecords.map((record) => record.slug));
  const merged = [
    ...dbRecords,
    ...seedRecords.filter((record) => !dbSlugs.has(record.slug)).map(toCatalogAdminRecord),
  ];

  return merged.sort(compareRecordsBySeasonEpisode);
}

async function getCatalogRecord(id: string): Promise<ArchivumRecord | null> {
  const supabase = await createClient();

  if (supabase) {
    const { data } = await supabase
      .from("records")
      .select("*")
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();

    if (data) {
      return mapRecord(data);
    }
  }

  return getSeedRecordById(id) ?? null;
}

async function syncCatalogRecordToDatabase(
  id: string,
  overrides: Partial<RecordInput> = {},
): Promise<ArchivumRecord> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  const catalog = await getCatalogRecord(id);
  if (!catalog) {
    throw new Error("Relato no encontrado.");
  }

  const payload = buildRecordPayload(catalog, overrides);

  const persistedId = await findPersistedRecordId(supabase, id, catalog.slug);

  if (persistedId) {
    const { data, error } = await supabase
      .from("records")
      .update(payload)
      .eq("id", persistedId)
      .select("*")
      .single();

    if (error) throw error;
    return mapRecord(data);
  }

  const { data, error } = await supabase.from("records").insert(payload).select("*").single();
  if (error) throw error;
  return mapRecord(data);
}

function getNovelKey(record: ArchivumRecord) {
  const titleKey = slugifyTitle(record.story_title.trim());
  if (titleKey) {
    return titleKey;
  }

  const storySlug = record.story_slug.trim();
  if (storySlug) {
    return storySlug;
  }

  return `record:${record.id}`;
}

function buildStoryAliases(records: ArchivumRecord[]) {
  const alias = new Map<string, string>();

  const find = (key: string) => {
    let current = key;
    while (alias.has(current)) {
      const next = alias.get(current)!;
      if (next === current) {
        break;
      }
      current = next;
    }
    return current;
  };

  const unite = (left: string, right: string) => {
    if (!left || !right || left === right) {
      return;
    }

    alias.set(find(right), find(left));
  };

  for (const record of records) {
    const titleKey = slugifyTitle(record.story_title.trim());
    const storySlug = record.story_slug.trim();
    if (titleKey && storySlug) {
      unite(titleKey, storySlug);
    }
  }

  return {
    resolve(record: ArchivumRecord) {
      const titleKey = slugifyTitle(record.story_title.trim());
      const storySlug = record.story_slug.trim();
      if (titleKey) {
        return find(titleKey);
      }

      if (storySlug) {
        return find(storySlug);
      }

      return `record:${record.id}`;
    },
  };
}

export function groupRecordsIntoCarouselNovels(records: ArchivumRecord[]): CarouselNovel[] {
  const { resolve } = buildStoryAliases(records);
  const groups = new Map<string, ArchivumRecord[]>();

  for (const record of records) {
    const key = resolve(record);
    const chapters = groups.get(key) ?? [];
    chapters.push(record);
    groups.set(key, chapters);
  }

  return Array.from(groups.entries())
    .map(([key, chapters]) => {
      const ordered = sortRecordsBySeasonEpisode(chapters);
      const entry = ordered[0];
      const cover_url = ordered.find((chapter) => chapter.cover_url)?.cover_url ?? null;
      const story_title =
        ordered.find((chapter) => chapter.story_title.trim())?.story_title.trim() || entry.title;

      return {
        id: key,
        story_title,
        story_slug: getNovelKey(entry),
        cover_url,
        synopsis: entry.synopsis,
        entry,
        chapters: ordered,
      };
    })
    .sort((left, right) => compareRecordsBySeasonEpisode(left.entry, right.entry));
}

export async function listCarouselRecords() {
  const supabase = await createClient();

  if (!supabase) {
    const featured = getSeedRecords({ featuredOnly: true });
    if (featured.length > 0) {
      return featured;
    }

    return getSeedRecords();
  }

  return listRecords({ featuredOnly: true, fallbackToSeed: false });
}

export async function listCarouselNovels() {
  const records = await listCarouselRecords();
  return groupRecordsIntoCarouselNovels(records);
}

export function listNovelChapters(
  records: ArchivumRecord[],
  anchor: ArchivumRecord,
) {
  const { resolve } = buildStoryAliases(records);
  const anchorKey = resolve(anchor);

  return sortRecordsBySeasonEpisode(
    records.filter((record) => resolve(record) === anchorKey),
  );
}

export function listNovelSeasonChapters(
  records: ArchivumRecord[],
  anchor: ArchivumRecord,
) {
  const { resolve } = buildStoryAliases(records);
  const anchorKey = resolve(anchor);

  return sortRecordsBySeasonEpisode(
    records.filter(
      (record) => resolve(record) === anchorKey && record.season === anchor.season,
    ),
  );
}

export async function listPublishedNovelSeasonChapters(anchor: ArchivumRecord) {
  const records = await listRecords();
  return listNovelSeasonChapters(records, anchor);
}

export async function getRecordById(id: string, options?: { includeUnpublished?: boolean }) {
  const supabase = await createClient();

  if (!supabase) {
    const record = getSeedRecordById(id);
    if (!record) return null;
    if (!options?.includeUnpublished && !record.published) return null;
    return record;
  }

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (error || !data) {
    const fallback = getSeedRecordById(id);
    if (!fallback) return null;
    if (!options?.includeUnpublished && !fallback.published) return null;
    return fallback;
  }

  const record = mapRecord(data);
  if (!options?.includeUnpublished && !record.published) return null;
  return record;
}

function getNextPublishedRecordFromList(
  records: ArchivumRecord[],
  record: ArchivumRecord,
): Pick<ArchivumRecord, "id" | "title"> | null {
  const ordered = listNovelChapters(records, record);
  const currentIndex = ordered.findIndex((item) => item.id === record.id);
  if (currentIndex < 0) {
    return null;
  }

  const next = ordered[currentIndex + 1];
  return next ? { id: next.id, title: next.title } : null;
}

export async function getNextRecord(
  record: ArchivumRecord,
): Promise<Pick<ArchivumRecord, "id" | "title"> | null> {
  const supabase = await createClient();

  if (!supabase) {
    return getNextPublishedRecordFromList(getSeedRecords(), record);
  }

  const records = await listRecords();
  return getNextPublishedRecordFromList(records, record);
}

function applyStoryScope<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  storySlug: string,
) {
  if (!storySlug) {
    return query;
  }

  return query.eq("story_slug", storySlug);
}

async function syncSeasonTitleForSeason(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  season: number,
  seasonTitle: string,
  storySlug: string,
) {
  if (!seasonTitle) {
    return;
  }

  let query = supabase.from("records").update({ season_title: seasonTitle }).eq("season", season);
  query = applyStoryScope(query, storySlug);
  const { error } = await query;

  if (error) {
    throw error;
  }
}

async function syncStoryIdentityForNovel(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  storySlug: string,
  storyTitle: string,
) {
  const canonicalSlug = storySlug || (storyTitle ? slugifyTitle(storyTitle) : "");
  if (!canonicalSlug) {
    return;
  }

  const titleKey = storyTitle ? slugifyTitle(storyTitle) : "";
  const { data, error } = await supabase.from("records").select("id, story_title, story_slug");
  if (error) {
    throw error;
  }

  const ids = (data ?? [])
    .filter((row) => {
      const rowSlug = String(row.story_slug ?? "").trim();
      const rowTitleKey = slugifyTitle(String(row.story_title ?? ""));
      return rowSlug === canonicalSlug || (titleKey && rowTitleKey === titleKey);
    })
    .map((row) => String(row.id));

  if (!ids.length) {
    return;
  }

  const { error: updateError } = await supabase
    .from("records")
    .update({
      story_title: storyTitle,
      story_slug: canonicalSlug,
    })
    .in("id", ids);

  if (updateError) {
    throw updateError;
  }
}

export async function getSeasonTitle(season: number) {
  const supabase = await createClient();

  if (!supabase) {
    const record = getSeedRecords().find(
      (item) => item.season === season && item.season_title.trim().length > 0,
    );
    return record?.season_title.trim() || null;
  }

  const { data, error } = await supabase
    .from("records")
    .select("season_title")
    .eq("season", season)
    .neq("season_title", "")
    .order("episode", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const title = String(data.season_title ?? "").trim();
  return title || null;
}

async function resolveSeasonCoverUrl(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  season: number,
  storyTitle: string,
  storySlug: string,
) {
  const canonicalSlug = storySlug || (storyTitle ? slugifyTitle(storyTitle) : "");
  const titleKey = storyTitle ? slugifyTitle(storyTitle) : "";
  if (!canonicalSlug && !titleKey) {
    return null;
  }

  const { data, error } = await supabase
    .from("records")
    .select("cover_url, story_title, story_slug")
    .eq("season", season)
    .not("cover_url", "is", null)
    .order("episode", { ascending: true });

  if (error || !data?.length) {
    return null;
  }

  const match = data.find((row) => {
    const rowSlug = String(row.story_slug ?? "").trim();
    const rowTitleKey = slugifyTitle(String(row.story_title ?? ""));
    return rowSlug === canonicalSlug || (titleKey && rowTitleKey === titleKey);
  });

  if (!match?.cover_url) {
    return null;
  }

  const coverUrl = String(match.cover_url).trim();
  return coverUrl || null;
}

export async function saveRecord(
  input: RecordInput & { id?: string },
  options?: { createdBy?: string },
) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  const seasonTitle = input.season_title.trim();
  const storyTitle = input.story_title.trim();
  const storySlug = storyTitle
    ? slugifyTitle(storyTitle)
    : input.story_slug.trim();
  const coverUrl =
    input.cover_url?.trim() ||
    (await resolveSeasonCoverUrl(supabase, input.season, storyTitle, storySlug));
  const payload = {
    title: input.title.trim(),
    slug: input.slug.trim(),
    synopsis: input.synopsis,
    content: input.content,
    season: input.season,
    episode: input.episode,
    story_title: storyTitle,
    story_slug: storySlug,
    season_title: seasonTitle,
    is_premium: input.is_premium,
    published: input.published,
    featured: input.featured,
    tags: input.tags,
    cover_url: coverUrl,
  };

  const finalizeSave = async (row: Record<string, unknown>) => {
    if (storySlug || storyTitle) {
      await syncStoryIdentityForNovel(supabase, storySlug, storyTitle);
    }

    if (seasonTitle) {
      await syncSeasonTitleForSeason(supabase, payload.season, seasonTitle, storySlug);
    }

    const record = mapRecord(row);
    return {
      ...record,
      story_title: storyTitle || record.story_title,
      story_slug: storySlug || record.story_slug,
      season_title: seasonTitle || record.season_title,
      cover_url: coverUrl ?? record.cover_url,
    };
  };

  if (input.id) {
    const catalog = await getCatalogRecord(input.id);
    if (!catalog) {
      throw new Error("Relato no encontrado.");
    }

    const persistedId = await findPersistedRecordId(supabase, input.id, catalog.slug);
    if (persistedId) {
      const { data, error } = await supabase
        .from("records")
        .update(payload)
        .eq("id", persistedId)
        .select("*")
        .single();

      assertNoSupabaseError(error, "No se pudo actualizar el relato.");
      return finalizeSave(data);
    }

    const record = await syncCatalogRecordToDatabase(input.id, payload);
    if (storySlug || storyTitle) {
      await syncStoryIdentityForNovel(supabase, storySlug, storyTitle);
    }
    if (seasonTitle) {
      await syncSeasonTitleForSeason(supabase, payload.season, seasonTitle, storySlug);
    }

    return {
      ...record,
      story_title: storyTitle || record.story_title,
      story_slug: storySlug || record.story_slug,
      season_title: seasonTitle || record.season_title,
      cover_url: coverUrl ?? record.cover_url,
    };
  }

  const { data: bySlug } = await supabase
    .from("records")
    .select("id")
    .eq("slug", payload.slug)
    .maybeSingle();

  if (bySlug) {
    throw new Error("Ya existe un relato con este slug.");
  }

  const insertPayload = {
    ...payload,
    ...(options?.createdBy ? { created_by: options.createdBy } : {}),
  };
  let { data, error } = await supabase.from("records").insert(insertPayload).select("*").single();

  if (error && options?.createdBy && isMissingCreatedByColumn(error)) {
    ({ data, error } = await supabase.from("records").insert(payload).select("*").single());
  }

  assertNoSupabaseError(error, "No se pudo guardar el relato.");
  return finalizeSave(data);
}

export async function setRecordPublished(id: string, published: boolean) {
  return syncCatalogRecordToDatabase(id, { published });
}

export async function setRecordFeatured(id: string, featured: boolean) {
  return syncCatalogRecordToDatabase(id, { featured });
}

export async function setRecordPremium(id: string, is_premium: boolean) {
  return syncCatalogRecordToDatabase(id, { is_premium });
}
