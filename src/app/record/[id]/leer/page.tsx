import { notFound } from "next/navigation";
import { RecordReader } from "@/components/reading/record-reader";
import { listPublicSeasonCharacters } from "@/lib/data/characters";
import {
  getNextRecord,
  getRecordById,
  listPublishedNovelSeasonChapters,
} from "@/lib/data/records";
import { getCurrentUserProfile } from "@/lib/data/users";

export default async function RecordReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [record, profile] = await Promise.all([getRecordById(id), getCurrentUserProfile()]);

  if (!record) {
    notFound();
  }

  const [nextRecord, seasonCharacters, chapters] = await Promise.all([
    getNextRecord(record),
    record.published
      ? listPublicSeasonCharacters(record.season, record.story_slug)
      : Promise.resolve([]),
    listPublishedNovelSeasonChapters(record),
  ]);

  const hubId = chapters[0]?.id ?? record.id;

  return (
    <RecordReader
      record={record}
      nextRecord={nextRecord ?? undefined}
      membershipLevel={profile?.membership_level ?? "free"}
      showSeasonCharacters={record.published && seasonCharacters.length > 0}
      backHref={`/record/${hubId}`}
    />
  );
}
