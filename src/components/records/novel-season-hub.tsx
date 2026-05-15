import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RecordCover } from "@/components/records/record-cover";
import { recordReadPath } from "@/lib/reader-path";
import { getRecordLabel } from "@/lib/records";
import type { ArchivumRecord } from "@/types";

interface NovelSeasonHubProps {
  anchor: ArchivumRecord;
  chapters: ArchivumRecord[];
}

const labelCopy = {
  libre: "Libre",
  clasificado: "Clasificado",
  premium: "Premium",
} as const;

export function NovelSeasonHub({ anchor, chapters }: NovelSeasonHubProps) {
  const storyTitle = anchor.story_title.trim() || anchor.title;
  const seasonTitle = anchor.season_title.trim();
  const coverUrl = chapters.find((chapter) => chapter.cover_url)?.cover_url ?? anchor.cover_url;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.35em] text-bone/45">Novela</p>
        <h1 className="mt-3 font-heading text-4xl text-bone sm:text-5xl">{storyTitle}</h1>
        <p className="mt-4 text-sm uppercase tracking-[0.24em] text-bone/55">
          {seasonTitle
            ? `Temporada ${anchor.season} · ${seasonTitle}`
            : `Temporada ${anchor.season}`}
        </p>
        <p className="mt-4 max-w-2xl text-bone/65">
          Elige un capítulo publicado de esta temporada para abrir la lectura.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {chapters.map((chapter) => {
            const label = getRecordLabel(chapter);

            return (
              <Link
                key={chapter.id}
                href={recordReadPath(chapter.id)}
                className="glass-panel cinematic-shadow overflow-hidden rounded-[1.75rem] transition hover:border-white/20"
              >
                <RecordCover
                  coverUrl={coverUrl}
                  title={chapter.title}
                  showOverlay={false}
                  className="rounded-none"
                />
                <div className="p-6">
                  <Badge variant="outline" className="capitalize">
                    {labelCopy[label]}
                  </Badge>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-bone/45">
                    Capítulo {chapter.episode}
                  </p>
                  <h2 className="mt-3 font-heading text-2xl text-bone sm:text-3xl">{chapter.title}</h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-bone/65">
                    {chapter.synopsis}
                  </p>
                  <p className="mt-6 text-sm text-bone/75">Leer capítulo</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
