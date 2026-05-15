import { notFound } from "next/navigation";
import { NovelSeasonHub } from "@/components/records/novel-season-hub";
import { getRecordById, listPublishedNovelSeasonChapters } from "@/lib/data/records";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const anchor = await getRecordById(id);

  if (!anchor) {
    notFound();
  }

  const chapters = await listPublishedNovelSeasonChapters(anchor);
  if (!chapters.length) {
    notFound();
  }

  return <NovelSeasonHub anchor={anchor} chapters={chapters} />;
}
