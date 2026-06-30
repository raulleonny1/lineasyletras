"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { StoryForm } from "@/components/admin/story-form";
import type { Story, StoryInput } from "@/types/story";
import { finalizeStorySave, type CoverUploadExtras } from "@/lib/admin/cover-upload";

export default function EditStoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/stories/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setStory(data.story ?? null);
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(data: StoryInput, extras?: CoverUploadExtras) {
    const res = await fetch(`/api/admin/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Error al guardar");

    const result = await finalizeStorySave(id, data, extras);

    if (data.published) {
      return result;
    }

    router.push("/admin/stories");
    router.refresh();
  }

  if (loading) return <p className="text-slate-500 text-sm">Cargando...</p>;
  if (!story) return <p className="text-rose-600 text-sm">Historia no encontrada.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-serif text-slate-900">Editar historia</h1>
        <p className="text-sm text-slate-500 mt-1">{story.title}</p>
      </div>
      <StoryForm initial={story} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
    </div>
  );
}
