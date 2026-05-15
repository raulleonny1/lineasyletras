import { slugifyTitle } from "@/lib/admin/record-input";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { compareRecordsBySeasonEpisode } from "@/lib/records";
import type { AdminRecord } from "@/types";

export interface DraftStoryGroup {
  key: string;
  story_title: string;
  cover_url: string | null;
  owner: AdminRecord["owner"];
  chapters: AdminRecord[];
}

export function isCatalogImport(record: AdminRecord) {
  return record.id.startsWith("rec-");
}

function getStoryGroupKey(record: AdminRecord) {
  const storySlug = record.story_slug.trim();
  if (storySlug) {
    return storySlug;
  }

  const storyTitle = slugifyTitle(record.story_title.trim());
  if (storyTitle) {
    return storyTitle;
  }

  return record.id;
}

export function formatRecordOwner(owner: AdminRecord["owner"]) {
  if (!owner) {
    return "Sin autor asignado";
  }

  const label = owner.name?.trim() || owner.email;
  return `${label} · ${ROLE_LABELS[owner.role]}`;
}

function formatSeasonLabel(chapter: AdminRecord) {
  if (chapter.season_title.trim().length > 0) {
    return `Temporada ${chapter.season} · ${chapter.season_title}`;
  }

  return `Temporada ${chapter.season}`;
}

export function formatDraftEpisodeLabel(chapter: AdminRecord) {
  return `${formatSeasonLabel(chapter)} · Episodio ${chapter.episode}`;
}

export function listDraftChapters(records: AdminRecord[]): AdminRecord[] {
  return records
    .filter((record) => !record.published && !isCatalogImport(record))
    .sort((left, right) => {
      const storyCompare = getStoryGroupKey(left).localeCompare(getStoryGroupKey(right), "es");
      if (storyCompare !== 0) {
        return storyCompare;
      }

      return compareRecordsBySeasonEpisode(left, right);
    });
}

export function groupDraftStories(records: AdminRecord[]): DraftStoryGroup[] {
  const groups = new Map<string, AdminRecord[]>();

  for (const record of records) {
    if (record.published || isCatalogImport(record)) {
      continue;
    }

    const key = getStoryGroupKey(record);
    const chapters = groups.get(key) ?? [];
    chapters.push(record);
    groups.set(key, chapters);
  }

  return Array.from(groups.entries())
    .map(([key, chapters]) => {
      const sorted = [...chapters].sort(compareRecordsBySeasonEpisode);
      const entry = sorted[0];
      const coverUrl = sorted.find((chapter) => chapter.cover_url)?.cover_url ?? entry.cover_url;

      return {
        key,
        story_title: entry.story_title.trim() || entry.title,
        cover_url: coverUrl,
        owner: entry.owner,
        chapters: sorted,
      };
    })
    .sort((left, right) => left.story_title.localeCompare(right.story_title, "es"));
}
