"use client";

import { useMemo, useState } from "react";
import type { Story } from "@/types/story";
import type { StoryFormat, NovelChapter } from "@/types/story-format";
import { STORY_COLORS } from "@/data/initial-stories";
import { computeReadTimeFromInput, parseTagsInput } from "@/lib/stories/utils";
import { createEmptyChapter } from "@/lib/stories/novel";
import {
  buildStoryPayloadFields,
  initialNovelChaptersFromStory,
  validateStoryBody,
} from "@/lib/stories/story-body";
import { CategorySelect } from "@/components/admin/category-select";
import { StoryBodyEditor } from "@/components/writing/story-body-editor";
import { NovelSeriesBanner } from "@/components/writing/novel-continuity-panel";
import { StoryReaderBody } from "@/components/reading/story-reader-body";
import { countNovelChapters, isNovelStory } from "@/lib/stories/novel";
import { isNovelContinued } from "@/types/story-format";
import { storyCoverHeaderClass, storyCoverHeaderStyle } from "@/lib/stories/cover";
import { formatLabel } from "@/types/story-format";

type Props = {
  authorName: string;
  onSaved: (story: Story) => void;
  onClose: () => void;
};

export function UserStoryEditor({ authorName, onSaved, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Fe y Esperanza");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<StoryFormat>("relato_corto");
  const [chapters, setChapters] = useState<NovelChapter[]>(() =>
    initialNovelChaptersFromStory()
  );
  const [novelContinued, setNovelContinued] = useState(true);
  const [tagsRaw, setTagsRaw] = useState("");
  const [color, setColor] = useState<string>(STORY_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFormatChange(next: StoryFormat) {
    setFormat(next);
    if (next === "novela") {
      if (chapters.length === 0) setChapters([createEmptyChapter()]);
      setNovelContinued(true);
    }
  }

  const previewStory = useMemo<Story>(() => {
    const bodyFields = buildStoryPayloadFields({
      format,
      content,
      novel: { chapters },
      novelContinued,
    });
    return {
      id: "preview",
      title: title.trim() || "Sin título",
      author: authorName,
      category,
      summary: summary.trim() || "Tu resumen aparecerá aquí…",
      ...bodyFields,
      content:
        bodyFields.content ||
        "Empieza a escribir tu historia en el panel izquierdo.",
      tags: parseTagsInput(tagsRaw),
      readTime: computeReadTimeFromInput({
        title,
        author: authorName,
        category,
        summary,
        tags: parseTagsInput(tagsRaw),
        color,
        ...bodyFields,
      }),
      date: new Date().toISOString().slice(0, 10),
      color,
      source: "user",
      isUserCreated: true,
    };
  }, [authorName, category, chapters, color, content, format, novelContinued, summary, tagsRaw, title]);

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    const bodyError = validateStoryBody({ format, content, novel: { chapters } });
    if (bodyError) {
      setError(bodyError);
      return;
    }

    const bodyFields = buildStoryPayloadFields({
      format,
      content,
      novel: { chapters },
      novelContinued,
    });

    setSaving(true);
    try {
      const res = await fetch("/api/user/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          summary: summary.trim(),
          ...bodyFields,
          tags: parseTagsInput(tagsRaw),
          color,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        return;
      }
      setSuccess("Historia guardada en tu biblioteca.");
      onSaved(data.story as Story);
      setTitle("");
      setSummary("");
      setContent("");
      setFormat("relato_corto");
      setChapters([createEmptyChapter()]);
      setNovelContinued(true);
      setTagsRaw("");
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0">
      <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-4 max-w-xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">Nueva historia</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 lg:hidden"
            >
              Cerrar
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-xl">
              {success}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass} font-serif font-semibold text-base`}
              placeholder="El título de tu historia"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
            <CategorySelect value={category} onChange={setCategory} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Resumen</label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inputClass}
              placeholder="Una frase que invite a leer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Etiquetas</label>
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              className={inputClass}
              placeholder="Fe, Esperanza, Paz"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Color de portada</label>
            <div className="flex flex-wrap gap-2">
              {STORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${c} ring-2 transition-all ${
                    color === c ? "ring-indigo-500 scale-110" : "ring-transparent"
                  }`}
                  aria-label="Elegir color"
                />
              ))}
            </div>
          </div>

          <StoryBodyEditor
            format={format}
            onFormatChange={handleFormatChange}
            content={content}
            onContentChange={setContent}
            chapters={chapters}
            onChaptersChange={setChapters}
            novelContinued={novelContinued}
            onNovelContinuedChange={setNovelContinued}
            disabled={saving}
            textareaRows={10}
            inputClass={`${inputClass} font-serif leading-relaxed`}
          />

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="hidden lg:inline px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
            >
              Volver
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 bg-slate-100 overflow-y-auto">
        <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            Vista previa · {formatLabel(format)}
          </p>

          <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div
              className={`${storyCoverHeaderClass(previewStory, "h-32")} p-5 flex flex-col justify-end`}
              style={storyCoverHeaderStyle(previewStory)}
            >
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                {previewStory.category}
              </span>
              <h3 className="text-white font-serif font-bold text-2xl mt-1">{previewStory.title}</h3>
            </div>

            <div className="p-5 space-y-4">
              {isNovelStory(previewStory) && (
                <NovelSeriesBanner
                  continued={isNovelContinued(previewStory)}
                  chapterCount={countNovelChapters(previewStory)}
                />
              )}
              <p className="text-slate-500 text-sm italic border-l-4 border-indigo-200 pl-3">
                {previewStory.summary}
              </p>
              <StoryReaderBody story={previewStory} fontSize="text-sm sm:text-base" />
              {previewStory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {previewStory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>

          <p className="text-center text-[11px] text-slate-400">
            Los borradores son privados hasta que un administrador los publique.
          </p>
        </div>
      </div>
    </div>
  );
}
