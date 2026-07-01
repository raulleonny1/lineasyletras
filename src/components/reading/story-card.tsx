"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import type { Story } from "@/types/story";
import { StorySocialBar } from "@/components/reading/story-social-bar";
import { storyCoverHeaderClass, storyCoverHeaderStyle, resolveStoryCoverSrc } from "@/lib/stories/cover";

type Props = {
  story: Story;
  isFavorite: boolean;
  onSelect: (story: Story) => void;
  onToggleFavorite: (id: string, e?: MouseEvent) => void;
  onNotify: (message: string) => void;
  featured?: boolean;
};

export function StoryCard({
  story,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onNotify,
  featured = false,
}: Props) {
  return (
    <article
      onClick={() => onSelect(story)}
      className={`bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group ${
        story.premium
          ? "border-amber-300/80 ring-1 ring-amber-200/60 hover:border-amber-400"
          : "border-slate-200 hover:border-indigo-200"
      } ${featured ? "min-w-[280px] sm:min-w-[320px] snap-center" : ""}`}
    >
      <div
        className={`${storyCoverHeaderClass(story, featured ? "h-32" : "h-24")} p-4 flex flex-col justify-between`}
        style={storyCoverHeaderStyle(story)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-wrap gap-1.5">
            {story.premium && (
              <span className="bg-amber-400/95 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                ✨ Premium
              </span>
            )}
            {story.format === "novela" && (
              <span className="bg-violet-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Novela
              </span>
            )}
            {story.format === "historia_corta" && (
              <span className="bg-white/25 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Historia corta
              </span>
            )}
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {story.category}
            </span>
          </div>

          <button
            onClick={(e) => onToggleFavorite(story.id, e)}
            className="bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-sm hover:scale-115 transition-all focus:outline-none shrink-0"
            aria-label="Guardar historia"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke={isFavorite ? "none" : "currentColor"}
              strokeWidth={2.5}
              className={`w-4 h-4 ${isFavorite ? "text-rose-500" : "text-slate-600"}`}
            >
              <path d="M11.645 20.91l-.007-.003-.003-.001a15.69 15.69 0 01-4.323-2.903C4.84 15.515 3 12.393 3 9.543 3 6.042 5.56 3 9 3c1.905 0 3.511 1.053 4.5 2.652L14.5 7.148l1.001-1.496C16.49 4.053 18.095 3 20 3c3.44 0 6 3.042 6 6.543 0 2.85-1.84 5.972-4.312 8.463A15.69 15.69 0 0115.355 20.9l-.007.003-.003.001a.752.752 0 01-.704 0z" />
            </svg>
          </button>
        </div>

        <div className="text-white/85 text-xs flex items-center gap-2">
          <span>⏱️ {story.readTime}</span>
          <span>•</span>
          <span>✍️ {story.author}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3
            className={`font-serif font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug ${
              featured ? "text-xl" : "text-lg"
            }`}
          >
            {story.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed font-sans">{story.summary}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <StorySocialBar
            storyId={story.id}
            title={story.title}
            summary={story.summary}
            coverImageUrl={resolveStoryCoverSrc(story)}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onNotify={onNotify}
            compact
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {story.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              href={`/etiqueta/${encodeURIComponent(tag.toLowerCase())}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-100 transition-colors"
            >
              #{tag}
            </Link>
          ))}
          {story.tags.length > 3 && (
            <span className="text-slate-400 text-[10px] px-1.5 py-0.5">+{story.tags.length - 3}</span>
          )}
        </div>
      </div>
    </article>
  );
}
