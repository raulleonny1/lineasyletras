"use client";

import type { NovelChapter } from "@/types/story-format";
import {
  createEmptyChapter,
  createEmptyScene,
  computeNovelWordCount,
  flattenNovelToContent,
} from "@/lib/stories/novel";
import { computeReadTime } from "@/lib/stories/utils";

type Props = {
  chapters: NovelChapter[];
  onChange: (chapters: NovelChapter[]) => void;
  disabled?: boolean;
  inputClass?: string;
};

const defaultInputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function NovelStructureEditor({
  chapters,
  onChange,
  disabled = false,
  inputClass = defaultInputClass,
}: Props) {
  const wordCount = computeNovelWordCount(chapters);
  const readTime = computeReadTime(flattenNovelToContent(chapters));

  function updateChapter(chapterId: string, patch: Partial<NovelChapter>) {
    onChange(chapters.map((ch) => (ch.id === chapterId ? { ...ch, ...patch } : ch)));
  }

  function removeChapter(chapterId: string) {
    if (chapters.length <= 1) return;
    onChange(chapters.filter((ch) => ch.id !== chapterId));
  }

  function addChapter() {
    onChange([...chapters, createEmptyChapter()]);
  }

  function updateScene(
    chapterId: string,
    sceneId: string,
    patch: { title?: string; content?: string }
  ) {
    onChange(
      chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        return {
          ...ch,
          scenes: ch.scenes.map((sc) => (sc.id === sceneId ? { ...sc, ...patch } : sc)),
        };
      })
    );
  }

  function addScene(chapterId: string) {
    onChange(
      chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, scenes: [...ch.scenes, createEmptyScene()] } : ch
      )
    );
  }

  function removeScene(chapterId: string, sceneId: string) {
    onChange(
      chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        if (ch.scenes.length <= 1) return ch;
        return { ...ch, scenes: ch.scenes.filter((sc) => sc.id !== sceneId) };
      })
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-500 uppercase">Capítulos y escenas</p>
        <p className="text-[11px] text-slate-400">
          {wordCount} palabras · {readTime}
        </p>
      </div>

      {chapters.map((chapter, chapterIndex) => (
        <div
          key={chapter.id}
          className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden"
        >
          <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-white">
            <span className="text-xs font-bold text-indigo-600 shrink-0">
              Cap. {chapterIndex + 1}
            </span>
            <input
              value={chapter.title}
              disabled={disabled}
              onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
              className={`${inputClass} font-serif font-semibold flex-1`}
              placeholder="Título del capítulo"
            />
            {chapters.length > 1 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeChapter(chapter.id)}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold shrink-0 px-2"
              >
                Eliminar
              </button>
            )}
          </div>

          <div className="p-3 space-y-3">
            {chapter.scenes.map((scene, sceneIndex) => (
              <div
                key={scene.id}
                className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                    Escena {sceneIndex + 1}
                  </span>
                  <input
                    value={scene.title}
                    disabled={disabled}
                    onChange={(e) => updateScene(chapter.id, scene.id, { title: e.target.value })}
                    className={inputClass}
                    placeholder="Título de la escena (opcional)"
                  />
                  {chapter.scenes.length > 1 && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeScene(chapter.id, scene.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 shrink-0"
                      aria-label="Eliminar escena"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <textarea
                  value={scene.content}
                  disabled={disabled}
                  onChange={(e) => updateScene(chapter.id, scene.id, { content: e.target.value })}
                  rows={6}
                  className={`${inputClass} font-serif leading-relaxed resize-y min-h-[120px]`}
                  placeholder="Escribe el contenido de esta escena…"
                />
              </div>
            ))}

            <button
              type="button"
              disabled={disabled}
              onClick={() => addScene(chapter.id)}
              className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              + Añadir escena
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={addChapter}
        className="w-full py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        + Añadir capítulo
      </button>
    </div>
  );
}
