"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useScroll, useSpring } from "framer-motion";
import { BookOpen, Lock, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ArchivumRecord } from "@/types";
import { getPreviewContent } from "@/lib/records";
import { recordReadPath } from "@/lib/reader-path";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocalCollection } from "@/hooks/use-local-collection";

interface RecordReaderProps {
  record: ArchivumRecord;
  nextRecord?: Pick<ArchivumRecord, "id" | "title">;
  membershipLevel?: "free" | "supporter" | "premium";
  showSeasonCharacters?: boolean;
  backHref?: string;
}

export function RecordReader({
  record,
  nextRecord,
  membershipLevel = "free",
  showSeasonCharacters = false,
  backHref = "/",
}: RecordReaderProps) {
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const { items, setItems } = useLocalCollection<string>("archivum-unlocked-records", []);
  const [percent, setPercent] = useState(0);

  const hasAccess = useMemo(() => {
    if (!record.is_premium) return true;
    if (membershipLevel === "premium" || membershipLevel === "supporter") return true;
    return items.includes(record.id);
  }, [items, membershipLevel, record.id, record.is_premium]);

  useEffect(() => {
    return progress.on("change", (value) => {
      setPercent(Math.round(value * 100));
    });
  }, [progress]);

  const unlockRecord = async () => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: record.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo iniciar el pago.");
      }
      if (!data.url) {
        throw new Error("Stripe no devolvió una URL de pago.");
      }
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error de pago.");
    }
  };

  const content = hasAccess ? record.content : getPreviewContent(record.content);

  return (
    <div className="reader-dark min-h-screen bg-[var(--reader-bg)] text-[var(--reader-text)]">
      <div className="pointer-events-auto fixed inset-x-0 top-0 z-[60] border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-[0.24em] text-bone/45 sm:text-xs sm:tracking-[0.28em]">
              {record.season_title.trim().length > 0
                ? `Temporada ${record.season} · ${record.season_title} · Episodio ${record.episode}`
                : `Temporada ${record.season} · Episodio ${record.episode}`}
            </p>
            <p className="truncate font-heading text-base text-bone sm:text-lg">{record.title}</p>
          </div>
          <Link
            href={backHref}
            prefetch
            replace
            aria-label="Volver a los capítulos"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "relative z-10 shrink-0",
            )}
            onClick={(event) => {
              event.preventDefault();
              window.location.assign(backHref);
            }}
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
        <Progress value={percent} className="h-1 rounded-none" />
      </div>

      <article className="mx-auto max-w-3xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-24 sm:px-6 sm:pb-32 sm:pt-28">
        <header className="mb-10 sm:mb-12">
          {record.story_title.trim().length > 0 ? (
            <p className="text-xs uppercase tracking-[0.28em] text-bone/45">{record.story_title}</p>
          ) : null}
          <h1 className="font-heading text-4xl font-light sm:text-5xl">{record.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-bone/65 sm:mt-6">{record.synopsis}</p>
          {record.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {record.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/etiqueta/${tag}`}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-bone/55 transition hover:border-white/20 hover:text-bone/80"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
          {showSeasonCharacters ? (
            <Button asChild variant="outline" className="mt-6 rounded-full">
              <Link href={`/temporada/${record.season}/personajes`}>
                <Users className="h-4 w-4" />
                Ver personajes de la temporada
              </Link>
            </Button>
          ) : null}
        </header>

        <div className="space-y-5 text-base leading-[1.85] sm:space-y-6 sm:text-lg sm:leading-[1.9]">
          {content.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        {!hasAccess && (
          <div className="mt-10 rounded-[1.5rem] border border-wine/30 bg-wine/10 p-6">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-bone/60">
              <Lock className="h-4 w-4" />
              Archivo restringido
            </div>
            <p className="mt-4 text-bone/75">
              Solo se ha liberado un fragmento. El resto permanece bajo cifrado.
            </p>
            <Button className="mt-6 rounded-full" onClick={unlockRecord}>
              Desbloquear archivo completo
            </Button>
          </div>
        )}
      </article>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/5 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {nextRecord ? (
            <Button asChild className="w-full rounded-full sm:w-auto">
              <Link href={recordReadPath(nextRecord.id)}>
                <BookOpen className="h-4 w-4" />
                Siguiente capítulo: {nextRecord.title}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
              <Link href={backHref}>Volver a los capítulos</Link>
            </Button>
          )}
          {user ? (
            <Button
              variant="outline"
              className="w-full rounded-full sm:w-auto"
              onClick={() => {
                if (!items.includes(record.id)) {
                  setItems((current) => [...current, record.id]);
                }
                toast.success("Progreso guardado en el expediente.");
              }}
            >
              Guardar progreso
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
              <Link href="/login">Iniciar sesión para guardar progreso</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
