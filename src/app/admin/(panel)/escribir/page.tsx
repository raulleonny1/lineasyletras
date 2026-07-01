"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StoryForm } from "@/components/admin/story-form";
import type { Story, StoryInput } from "@/types/story";
import { loadAdminDraft, clearAdminDraft } from "@/lib/admin/draft-storage";
import { finalizeStorySave, type CoverUploadExtras } from "@/lib/admin/cover-upload";

export default function AdminEscribirPage() {
  const router = useRouter();
  const [initial, setInitial] = useState<Story | undefined>();
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const draft = loadAdminDraft();
    if (draft) {
      setInitial({
        id: "draft",
        title: draft.title ?? "",
        author: "Líneas y Letras",
        category: draft.category ?? "Fe y Esperanza",
        summary: draft.summary ?? "",
        content: draft.content ?? "",
        tags: draft.tags ? draft.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        readTime: "1 min",
        date: new Date().toISOString().split("T")[0],
        color: "from-indigo-500 to-sky-500",
        published: false,
        source: "admin",
      });
      setImported(true);
      clearAdminDraft();
    }
  }, []);

  async function handleSubmit(data: StoryInput, extras?: CoverUploadExtras) {
    const res = await fetch("/api/admin/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Error al guardar");

    const story = json.story as Story;
    const result = await finalizeStorySave(story.id, data, extras);

    if (data.published) {
      return result;
    }

    router.push(`/admin/stories/${story.id}/edit`);
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">✍️ Escribir</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crea lecciones, devocionales y relatos. Al publicar, aparecen en el inicio y podrás
            compartir en Facebook con imagen.
          </p>
        </div>
      </div>

      {imported && (
        <div className="bg-violet-50 border border-violet-200 text-violet-800 text-sm p-3 rounded-xl">
          Borrador cargado. Revisa y publica cuando esté listo.
        </div>
      )}

      <StoryForm
        key={initial?.content?.slice(0, 20) ?? "new"}
        initial={initial}
        onSubmit={handleSubmit}
        submitLabel="Guardar historia"
      />
    </div>
  );
}
