import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RecordCover } from "@/components/records/record-cover";
import { listPublishedTags, listRecords } from "@/lib/data/records";
import { getRecordLabel } from "@/lib/records";

const labelCopy = {
  libre: "Libre",
  clasificado: "Clasificado",
  premium: "Premium",
} as const;

export default async function ArchivePage() {
  const [records, tags] = await Promise.all([listRecords(), listPublishedTags()]);

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.35em] text-bone/45">Exploración</p>
        <h1 className="mt-3 font-heading text-4xl text-bone sm:text-5xl">Registros clasificados</h1>
        <p className="mt-4 max-w-2xl text-bone/65">
          Historias episódicas organizadas como archivos dentro del universo Archivum Noctis.
        </p>

        {tags.length > 0 ? (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.28em] text-bone/45">Etiquetas</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/etiqueta/${tag}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-bone/75 transition hover:border-white/20 hover:text-bone"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => {
            const label = getRecordLabel(record);

            return (
              <Link
                key={record.id}
                href={`/record/${record.id}`}
                className="glass-panel cinematic-shadow overflow-hidden rounded-[1.75rem] transition hover:border-white/20"
              >
                <RecordCover coverUrl={record.cover_url} showOverlay={false} className="rounded-none" />
                <div className="p-6">
                  <Badge variant="outline" className="capitalize">
                    {labelCopy[label]}
                  </Badge>
                <h2 className="mt-4 font-heading text-2xl text-bone sm:text-3xl">{record.title}</h2>
                {record.story_title.trim().length > 0 ? (
                  <p className="mt-2 text-sm text-bone/55">{record.story_title}</p>
                ) : null}
                <p className="mt-3 text-sm leading-relaxed text-bone/65">{record.synopsis}</p>
                {record.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {record.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-bone/55"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-6 text-xs uppercase tracking-[0.24em] text-bone/45">
                  {record.season_title.trim().length > 0
                    ? `Temporada ${record.season} · ${record.season_title} · Episodio ${record.episode}`
                    : `Temporada ${record.season} · Episodio ${record.episode}`}
                </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
