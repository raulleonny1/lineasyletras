"use client";

import { useState, useEffect, type MouseEvent } from "react";
import { getStoryShareUrl, nativeShare } from "@/lib/share";
import { StoryShareModal } from "@/components/reading/story-share-modal";

const STORAGE_LIKED = "lineas_letras_liked";

type SharePlatform = "facebook" | "instagram";

type Props = {
  storyId: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e?: MouseEvent) => void;
  onNotify: (message: string) => void;
  compact?: boolean;
};

export function StorySocialBar({
  storyId,
  title,
  summary,
  coverImageUrl,
  isFavorite,
  onToggleFavorite,
  onNotify,
  compact = false,
}: Props) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [sharePlatform, setSharePlatform] = useState<SharePlatform | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_LIKED);
    if (saved) {
      try {
        const ids: string[] = JSON.parse(saved);
        setLiked(ids.includes(storyId));
      } catch {
        /* ignore */
      }
    }
  }, [storyId]);

  useEffect(() => {
    fetch(`/api/stories/${storyId}/like`)
      .then((r) => r.json())
      .then((d) => setLikeCount(d.likeCount ?? 0))
      .catch(() => {});
  }, [storyId]);

  const persistLiked = (ids: string[]) => {
    localStorage.setItem(STORAGE_LIKED, JSON.stringify(ids));
  };

  const handleHeart = async (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (loadingLike) return;

    const currentlyLiked = liked || isFavorite;
    const willLike = !currentlyLiked;
    setLoadingLike(true);

    if (isFavorite !== willLike) {
      onToggleFavorite(storyId, e);
    }

    try {
      const res = await fetch(`/api/stories/${storyId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: willLike }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikeCount(data.likeCount ?? 0);
        setLiked(willLike);
        const saved = localStorage.getItem(STORAGE_LIKED);
        let ids: string[] = saved ? JSON.parse(saved) : [];
        if (willLike) {
          if (!ids.includes(storyId)) ids.push(storyId);
        } else {
          ids = ids.filter((id) => id !== storyId);
        }
        persistLiked(ids);
        onNotify(willLike ? "¡Gracias por tu corazón!" : "Corazón retirado");
      }
    } catch {
      onNotify("No se pudo registrar tu calificación");
    } finally {
      setLoadingLike(false);
    }
  };

  const openShare = (e: MouseEvent, platform: SharePlatform) => {
    e.stopPropagation();
    setSharePlatform(platform);
  };

  const handleCopyLink = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getStoryShareUrl(storyId));
      onNotify("Enlace copiado al portapapeles");
    } catch {
      onNotify(getStoryShareUrl(storyId));
    }
  };

  const handleNativeShare = async (e: MouseEvent) => {
    e.stopPropagation();
    const ok = await nativeShare(storyId, title, summary);
    if (!ok) handleCopyLink(e);
  };

  const heartActive = liked || isFavorite;

  const shareModal = sharePlatform ? (
    <StoryShareModal
      storyId={storyId}
      title={title}
      summary={summary}
      coverImageUrl={coverImageUrl}
      platform={sharePlatform}
      onClose={() => setSharePlatform(null)}
      onNotify={onNotify}
    />
  ) : null;

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleHeart}
            className="p-1.5 rounded-full hover:bg-rose-50 transition-colors"
            title="Calificar con corazón"
            aria-label="Calificar con corazón"
          >
            <HeartIcon filled={heartActive} className="w-4 h-4 text-rose-500" />
          </button>
          <button
            onClick={(e) => openShare(e, "facebook")}
            className="p-1.5 rounded-full hover:bg-blue-50 transition-colors"
            title="Compartir en tu Facebook"
            aria-label="Compartir en Facebook"
          >
            <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
          </button>
          <button
            onClick={(e) => openShare(e, "instagram")}
            className="p-1.5 rounded-full hover:bg-pink-50 transition-colors"
            title="Compartir en tu Instagram"
            aria-label="Compartir en Instagram"
          >
            <InstagramIcon className="w-4 h-4 text-[#E4405F]" />
          </button>
        </div>
        {shareModal}
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          ¿Te gustó esta historia?
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleHeart}
            disabled={loadingLike}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              heartActive
                ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                : "bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            <HeartIcon filled={heartActive} className="w-5 h-5" />
            <span>{heartActive ? "Te encanta" : "Dar corazón"}</span>
            {likeCount > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${heartActive ? "bg-rose-400" : "bg-rose-100 text-rose-700"}`}
              >
                {likeCount}
              </span>
            )}
          </button>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Compartir:</span>
            <button
              onClick={(e) => openShare(e, "facebook")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              title="Compartir en tu muro de Facebook"
            >
              <FacebookIcon className="w-4 h-4" />
              Facebook
            </button>
            <button
              onClick={(e) => openShare(e, "instagram")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              title="Compartir en tu Instagram"
            >
              <InstagramIcon className="w-4 h-4" />
              Instagram
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition-colors"
              >
                Más opciones
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
              title="Copiar enlace"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {shareModal}
    </>
  );
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      className={className}
    >
      <path d="M11.645 20.91l-.007-.003-.003-.001a15.69 15.69 0 01-4.323-2.903C4.84 15.515 3 12.393 3 9.543 3 6.042 5.56 3 9 3c1.905 0 3.511 1.053 4.5 2.652L14.5 7.148l1.001-1.496C16.49 4.053 18.095 3 20 3c3.44 0 6 3.042 6 6.543 0 2.85-1.84 5.972-4.312 8.463A15.69 15.69 0 0115.355 20.9l-.007.003-.003.001a.752.752 0 01-.704 0z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  );
}
