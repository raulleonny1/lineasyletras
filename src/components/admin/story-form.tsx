"use client";

import { useState, type FormEvent } from "react";
import type { Story, StoryInput } from "@/types/story";
import { STORY_COLORS } from "@/data/initial-stories";
import { computeReadTime, parseTagsInput } from "@/lib/stories/utils";
import { CategorySelect } from "@/components/admin/category-select";
import { CoverImageCropper } from "@/components/admin/cover-image-cropper";
import { PublishFacebookModal } from "@/components/admin/publish-facebook-modal";
import type { CoverUploadExtras, PublishResult } from "@/lib/admin/cover-upload";

type StoryFormProps = {
  initial?: Story;
  onSubmit: (data: StoryInput, extras?: CoverUploadExtras) => Promise<PublishResult | void>;
  submitLabel: string;
};

export function StoryForm({ initial, onSubmit, submitLabel }: StoryFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "Líneas y Letras");
  const [category, setCategory] = useState(initial?.category ?? "Fe y Esperanza");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tagsRaw, setTagsRaw] = useState(initial?.tags.join(", ") ?? "");
  const [color, setColor] = useState(initial?.color ?? STORY_COLORS[0]);
  const [published, setPublished] = useState(initial?.published ?? false);
  const [premium, setPremium] = useState(initial?.premium ?? false);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.coverImageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [facebookStory, setFacebookStory] = useState<PublishResult | null>(null);

  function handleCoverChange(blob: Blob | null, previewUrl: string | null) {
    setCoverBlob(blob);
    setCoverPreview(previewUrl);
    setCoverRemoved(blob === null && previewUrl === null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("El título y el contenido son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const extras: CoverUploadExtras = {};
      if (coverBlob) extras.coverBlob = coverBlob;
      else if (coverRemoved && initial?.coverImageUrl) extras.removeCover = true;

      const result = await onSubmit(
        {
          title: title.trim(),
          author: author.trim(),
          category,
          summary: summary.trim(),
          content: content.trim(),
          tags: parseTagsInput(tagsRaw),
          color,
          published,
          premium,
          readTime: computeReadTime(content),
          source: "admin",
          coverImageUrl: coverRemoved ? undefined : initial?.coverImageUrl,
        },
        extras
      );

      if (result?.published) {
        setFacebookStory(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-serif font-semibold text-lg"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Autor</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Categoría *</label>
            <CategorySelect value={category} onChange={setCategory} />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Resumen</label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              placeholder="Breve descripción para las tarjetas y Facebook"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Imagen de portada (para Facebook y tarjetas)
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Tamaño mediano. El sistema recorta y ajusta automáticamente al subirla.
            </p>
            <CoverImageCropper
              currentUrl={coverRemoved ? undefined : coverPreview ?? initial?.coverImageUrl}
              onChange={handleCoverChange}
            />
            {coverPreview && (
              <p className="text-xs text-emerald-600 mt-1">✓ Imagen lista para publicar</p>
            )}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Etiquetas (separadas por comas)</label>
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              placeholder="fe, paz, esperanza"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Contenido *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-serif leading-relaxed"
              required
            />
            <p className="text-xs text-slate-400 text-right">
              {content.trim() ? content.trim().split(/\s+/).length : 0} palabras · {computeReadTime(content)}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Color de tarjeta (si no hay imagen)
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
            >
              {STORY_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-3">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600"
              />
              <label htmlFor="published" className="text-sm font-medium text-slate-700">
                Publicar en el sitio (visible en inicio y etiquetas)
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="premium"
                type="checkbox"
                checked={premium}
                onChange={(e) => setPremium(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 mt-0.5"
              />
              <label htmlFor="premium" className="text-sm font-medium text-slate-700">
                <span className="text-amber-700 font-bold">✨ Historia Premium</span>
                <span className="block text-xs text-slate-500 font-normal mt-0.5">
                  Aparece destacada en la sección Premium del inicio (arriba del catálogo).
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            {saving ? "Guardando..." : submitLabel}
          </button>
        </div>
      </form>

      {facebookStory && (
        <PublishFacebookModal
          storyId={facebookStory.id}
          title={facebookStory.title}
          summary={facebookStory.summary}
          coverImageUrl={facebookStory.coverImageUrl}
          coverPreview={coverPreview}
          onClose={() => setFacebookStory(null)}
        />
      )}
    </>
  );
}
