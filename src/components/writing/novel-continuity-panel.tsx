"use client";

import { isNovelContinued } from "@/types/story-format";

type EditorProps = {
  continued: boolean;
  onContinuedChange: (value: boolean) => void;
  chapterCount: number;
  disabled?: boolean;
};

export function NovelContinuityPanel({
  continued,
  onContinuedChange,
  chapterCount,
  disabled = false,
}: EditorProps) {
  return (
    <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50/80 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden>
          📖
        </span>
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-bold text-violet-900">Estás escribiendo una novela continuada</p>
          <p className="text-xs text-violet-800/90 leading-relaxed">
            Una novela se publica por partes: capítulos y escenas que los lectores irán
            descubriendo. Puedes guardar ahora y añadir más capítulos después. Los lectores verán
            que es una obra en desarrollo.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full">
          {chapterCount} capítulo{chapterCount !== 1 ? "s" : ""} por ahora
        </span>
        <span className="text-violet-600">·</span>
        <span className="text-violet-700 font-medium">Formato: novela serial</span>
      </div>

      <label className="flex items-start gap-3 cursor-pointer rounded-xl bg-white/70 border border-violet-100 p-3">
        <input
          type="checkbox"
          checked={continued}
          disabled={disabled}
          onChange={(e) => onContinuedChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-violet-300 text-violet-600"
        />
        <span className="text-xs text-violet-900">
          <span className="font-bold block">Novela en curso (continuada)</span>
          <span className="text-violet-700/90 mt-0.5 block">
            Marca esto si aún publicarás más capítulos. Desmarca solo cuando la historia esté
            terminada.
          </span>
        </span>
      </label>
    </div>
  );
}

type ReaderProps = {
  continued: boolean;
  chapterCount: number;
};

export function NovelSeriesBanner({ continued, chapterCount }: ReaderProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${
        continued
          ? "bg-violet-50 border-violet-200 text-violet-900"
          : "bg-slate-50 border-slate-200 text-slate-700"
      }`}
    >
      <span className="font-bold flex items-center gap-1.5">
        {continued && (
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" aria-hidden />
        )}
        📖 {continued ? "Novela continuada" : "Novela completa"}
      </span>
      <span className="text-xs opacity-80">
        {chapterCount} capítulo{chapterCount !== 1 ? "s" : ""} publicado
        {chapterCount !== 1 ? "s" : ""}
        {continued ? " · Se irán añadiendo más" : ""}
      </span>
    </div>
  );
}

export function NovelFormatBadge({
  format,
  novelContinued,
}: {
  format?: string;
  novelContinued?: boolean;
}) {
  if (format !== "novela") return null;

  const continued = isNovelContinued({ format: "novela", novelContinued });

  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 ${
        continued ? "bg-violet-500/95 text-white" : "bg-violet-400/80 text-white"
      }`}
    >
      {continued && <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />}
      {continued ? "Novela continuada" : "Novela completa"}
    </span>
  );
}
