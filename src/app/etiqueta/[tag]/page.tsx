import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { RecordCover } from "@/components/records/record-cover";
import { normalizeTag } from "@/lib/admin/record-input";
import { listRecords } from "@/lib/data/records";
import { getRecordLabel } from "@/lib/records";

const labelCopy = {
  libre: "Libre",
  clasificado: "Clasificado",
  premium: "Premium",
} as const;

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: rawTag } = await params;
  const tag = normalizeTag(decodeURIComponent(rawTag));

  if (!tag) {
    notFound();
  }

  const records = await listRecords({ tag });

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.35em] text-bone/45">Etiqueta</p>
        <h1 className="mt-3 font-heading text-4xl text-bone sm:text-5xl">#{tag}</h1>
        <p className="mt-4 max-w-2xl text-bone/65">
          Relatos publicados con esta etiqueta en el archivo.
        </p>
        <Link
          href="/archive"
          className="mt-6 inline-block text-sm text-bone/60 underline-offset-2 hover:text-bone hover:underline"
        >
          Ver todos los registros
        </Link>

        {records.length === 0 ? (
          <p className="mt-12 rounded-[1.25rem] border border-white/10 bg-white/5 p-6 text-sm text-bone/65">
            Todavía no hay relatos publicados con esta etiqueta.
          </p>
        ) : (
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
                  <p className="mt-3 text-sm leading-relaxed text-bone/65">{record.synopsis}</p>
                  <p className="mt-6 text-xs uppercase tracking-[0.24em] text-bone/45">
                    Temporada {record.season} · Episodio {record.episode}
                  </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
