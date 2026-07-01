"use client";

import Link from "next/link";
import type { Story } from "@/types/story";
import { storyCoverHeaderClass, storyCoverHeaderStyle } from "@/lib/stories/cover";

type Props = {
  story: Story;
  badge?: string;
  onRead?: () => void;
  compact?: boolean;
};

export function LibraryStoryItem({ story, badge, onRead, compact = false }: Props) {
  const href = `/historia/${story.id}`;

  return (
    <article
      className={`group flex gap-3 sm:gap-4 bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 hover:border-indigo-200 hover:shadow-sm transition-all ${
        compact ? "" : "sm:items-center"
      }`}
    >
      <div
        className={`${storyCoverHeaderClass(story, compact ? "h-16 w-16 sm:h-20 sm:w-20" : "h-20 w-20 sm:h-24 sm:w-24")} rounded-xl shrink-0`}
        style={storyCoverHeaderStyle(story)}
        aria-hidden
      />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          {story.premium && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              Premium
            </span>
          )}
          <span className="text-[10px] text-slate-400">{story.category}</span>
        </div>
        <h3 className="font-serif font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
          {story.title}
        </h3>
        {!compact && (
          <p className="text-sm text-slate-500 line-clamp-2">{story.summary}</p>
        )}
        <p className="text-[11px] text-slate-400">
          ⏱️ {story.readTime} · ✍️ {story.author}
        </p>
      </div>

      <div className="flex flex-col justify-center shrink-0">
        {onRead ? (
          <button
            type="button"
            onClick={onRead}
            className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-colors"
          >
            Leer
          </button>
        ) : (
          <Link
            href={href}
            className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-colors text-center"
          >
            Leer
          </Link>
        )}
      </div>
    </article>
  );
}
