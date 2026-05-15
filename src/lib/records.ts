import type { RecordLabel } from "@/types";

export type { MembershipLevel, RecordLabel, ArchivumRecord, UserProfile, UserRole, ReadingProgress, Payment } from "@/types";

export function getRecordLabel(record: {
  is_premium: boolean;
  episode: number;
}): RecordLabel {
  if (record.is_premium) return "premium";
  if (record.episode === 1) return "libre";
  return "clasificado";
}

export function compareRecordsBySeasonEpisode(
  left: { season: number; episode: number },
  right: { season: number; episode: number },
) {
  if (left.season !== right.season) {
    return left.season - right.season;
  }

  return left.episode - right.episode;
}

export function getPreviewContent(content: string, ratio = 0.35) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    const cutoff = Math.max(280, Math.floor(content.length * ratio));
    return `${content.slice(0, cutoff).trim()}…`;
  }

  const visible = Math.max(1, Math.ceil(paragraphs.length * ratio));
  return paragraphs.slice(0, visible).join("\n\n");
}
