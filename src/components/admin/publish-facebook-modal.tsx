"use client";

import { getFacebookShareUrl } from "@/lib/share";

type Props = {
  storyId: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  onClose: () => void;
};

export function PublishFacebookModal({ storyId, title, summary, coverImageUrl, onClose }: Props) {
  const shareUrl = getFacebookShareUrl(storyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="text-center space-y-1">
          <span className="text-2xl">🎉</span>
          <h2 className="text-xl font-bold font-serif text-slate-900">¡Historia publicada!</h2>
          <p className="text-sm text-slate-500">
            Tu historia ya está visible en el sitio. Compártela en Facebook con su imagen.
          </p>
        </div>

        {coverImageUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImageUrl} alt={title} className="w-full h-40 object-cover" />
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-3 text-sm">
          <p className="font-semibold text-slate-800 line-clamp-2">{title}</p>
          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{summary}</p>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#1877F2] hover:opacity-90 text-white font-bold py-3 rounded-xl text-sm transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Publicar en Facebook
          </a>
          {!coverImageUrl && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
              Sin imagen de portada, Facebook mostrará solo el texto del enlace. Añade una imagen
              al editar la historia para mejor vista previa.
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 py-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
