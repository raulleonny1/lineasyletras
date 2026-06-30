"use client";

import { useState } from "react";
import {
  buildFullShareText,
  isLocalDevUrl,
  shareToFacebookPersonal,
  shareToInstagramPersonal,
} from "@/lib/share";

type Platform = "facebook" | "instagram";

type Props = {
  storyId: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  platform: Platform;
  onClose: () => void;
  onNotify: (message: string) => void;
};

export function StoryShareModal({
  storyId,
  title,
  summary,
  coverImageUrl,
  platform,
  onClose,
  onNotify,
}: Props) {
  const [loading, setLoading] = useState(false);
  const shareText = buildFullShareText(storyId, title, summary);
  const isFacebook = platform === "facebook";

  async function handleShare() {
    setLoading(true);
    try {
      if (isFacebook) {
        const result = await shareToFacebookPersonal(storyId, title, summary);
        if (result === "cancelled") return;
        if (result === "native") {
          onNotify("¡Listo! Elige Facebook para publicar en tu muro.");
        } else {
          onNotify(
            "Texto copiado. En Facebook, pega en tu publicación personal si no aparece el enlace. Si ves la página de Líneas y Letras, cambia a tu perfil arriba."
          );
        }
        onClose();
      } else {
        const result = await shareToInstagramPersonal(storyId, title, summary);
        if (result === "cancelled") return;
        onNotify(
          result === "native"
            ? "¡Listo! Elige Instagram para compartir en tu perfil."
            : "Texto copiado. Abre Instagram y pégalo en tu historia o publicación."
        );
        onClose();
      }
    } catch {
      onNotify("No se pudo compartir. Intenta copiar el texto manualmente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      onNotify("Texto copiado al portapapeles");
    } catch {
      onNotify(shareText);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-serif text-slate-900">
              {isFacebook ? "Compartir en Facebook" : "Compartir en Instagram"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Publica esta historia en <strong>tu muro personal</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {coverImageUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImageUrl} alt="" className="w-full h-36 object-cover" />
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
          <p className="font-semibold text-slate-900 text-sm leading-snug">{title}</p>
          <p className="text-xs text-slate-500 line-clamp-3">{summary}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Se compartirá:</p>
          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{shareText}</p>
        </div>

        {isLocalDevUrl() && isFacebook && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
            Estás en localhost: Facebook no puede mostrar la vista previa aquí. En el sitio
            publicado el enlace y la imagen sí aparecerán al compartir.
          </p>
        )}

        {!isFacebook && (
          <p className="text-xs text-slate-500">
            Instagram no permite compartir enlaces directamente. Copiamos el texto para que lo
            pegues en tu historia o publicación.
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleShare}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm text-white transition-opacity disabled:opacity-60 ${
              isFacebook
                ? "bg-[#1877F2] hover:opacity-90"
                : "bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-90"
            }`}
          >
            {loading
              ? "Abriendo..."
              : isFacebook
                ? "Compartir en mi muro de Facebook"
                : "Compartir en mi Instagram"}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="text-sm text-indigo-600 hover:underline py-2"
          >
            Solo copiar texto
          </button>
        </div>
      </div>
    </div>
  );
}
