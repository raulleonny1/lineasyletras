"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { togglePublishAction } from "@/app/admin/actions";
import {
  formatDraftEpisodeLabel,
  formatRecordOwner,
  listDraftChapters,
} from "@/lib/admin/draft-stories";
import { getErrorMessage } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";
import { RecordCover } from "@/components/records/record-cover";
import type { AdminRecord } from "@/types";

interface DraftStoriesPanelProps {
  records: AdminRecord[];
}

export function DraftStoriesPanel({ records }: DraftStoriesPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const draftChapters = useMemo(() => listDraftChapters(records), [records]);

  const runMutation = (task: () => Promise<unknown>, successMessage: string) => {
    startTransition(async () => {
      try {
        await task();
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo actualizar."));
      }
    });
  };

  if (draftChapters.length === 0) {
    return (
      <p className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5 text-sm text-bone/65">
        No hay capítulos en borrador. Si buscas un episodio publicado, revísalo en Administración.
        Los borradores solo aparecen aquí.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {draftChapters.map((chapter) => {
        const storyTitle = chapter.story_title.trim() || chapter.title;
        const chapterTitle = chapter.title.trim();
        const chapterSummary = chapter.synopsis.trim();

        return (
          <article
            key={chapter.id}
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5"
          >
            <RecordCover
              className="mb-4"
              coverUrl={chapter.cover_url}
              title={storyTitle}
              label="Borrador"
            />
            <p className="text-xs uppercase tracking-[0.2em] text-bone/50">Sin publicar</p>
            <h2 className="mt-2 font-heading text-2xl text-bone">{storyTitle}</h2>
            <p className="mt-2 text-sm text-bone/60">{formatRecordOwner(chapter.owner)}</p>
            <p className="mt-2 text-xs text-bone/45">{formatDraftEpisodeLabel(chapter)}</p>
            <p className="mt-2 line-clamp-2 text-sm text-bone/65">
              {chapterTitle || chapterSummary}
            </p>
            {chapterTitle && chapterSummary ? (
              <p className="mt-1 line-clamp-2 text-sm text-bone/55">{chapterSummary}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/admin?edit=${chapter.id}`}>Editar</Link>
              </Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  runMutation(
                    () => togglePublishAction(chapter.id, true),
                    "Capítulo publicado.",
                  )
                }
              >
                Publicar
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
