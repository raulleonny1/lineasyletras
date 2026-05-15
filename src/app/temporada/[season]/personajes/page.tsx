import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterPortrait } from "@/components/characters/character-portrait";
import { Button } from "@/components/ui/button";
import { listPublicSeasonCharacters, seasonHasPublishedRecords } from "@/lib/data/characters";
import { getSeasonTitle } from "@/lib/data/records";

export default async function SeasonCharactersPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season: seasonParam } = await params;
  const season = Number(seasonParam);

  if (!Number.isFinite(season) || season < 1) {
    notFound();
  }

  const [launched, seasonTitle] = await Promise.all([
    seasonHasPublishedRecords(season),
    getSeasonTitle(season),
  ]);
  if (!launched) {
    notFound();
  }

  const characters = await listPublicSeasonCharacters(season);
  if (!characters.length) {
    notFound();
  }

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.35em] text-bone/45">
          {seasonTitle ? `Temporada ${season} · ${seasonTitle}` : `Temporada ${season}`}
        </p>
        <h1 className="mt-3 font-heading text-4xl text-bone sm:text-5xl">Personajes</h1>
        <p className="mt-4 max-w-2xl text-bone/65">
          Expediente de figuras vinculadas a esta temporada del archivo.
        </p>

        <div className="mt-12 space-y-4">
          {characters.map((character) => (
            <article
              key={character.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <CharacterPortrait
                  name={character.name}
                  imageUrl={character.image_url}
                  className="w-full max-w-[12rem] shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl text-bone sm:text-3xl">{character.name}</h2>
                  {character.role ? (
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-bone/50">
                      {character.role}
                    </p>
                  ) : null}
                  {character.description ? (
                    <p className="mt-4 text-base leading-relaxed text-bone/70">
                      {character.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/archive">Volver al archivo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
