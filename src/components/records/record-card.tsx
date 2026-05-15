"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CarouselNovel } from "@/types";
import { getRecordLabel } from "@/lib/records";
import { RecordCover } from "@/components/records/record-cover";
import { cn } from "@/lib/utils";

interface RecordCardProps {
  novel: CarouselNovel;
  active?: boolean;
  onSelect?: () => void;
}

const labelCopy = {
  libre: "Libre",
  clasificado: "Clasificado",
  premium: "Premium",
} as const;

export function RecordCard({ novel, active = false, onSelect }: RecordCardProps) {
  const label = getRecordLabel(novel.entry);
  const chapterCount = novel.chapters.length;

  return (
    <motion.article
      layout
      onClick={onSelect}
      whileHover={{ y: active ? 0 : -10 }}
      className={cn(
        "group relative w-[min(84vw,320px)] shrink-0 snap-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition sm:w-[min(88vw,320px)] sm:p-5",
        active ? "cinematic-shadow scale-100 md:scale-105" : "scale-95 opacity-80",
      )}
    >
      <RecordCover
        className="mb-5"
        coverUrl={novel.cover_url}
        title={novel.story_title}
        label={labelCopy[label]}
        priority={active}
      />

      <p className="line-clamp-3 text-sm leading-relaxed text-bone/70 transition group-hover:text-bone/90">
        {novel.synopsis}
      </p>

      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-bone/45">
        {chapterCount === 1
          ? `Empieza en ${novel.entry.title}`
          : `${chapterCount} capítulos en carrusel`}
      </p>

      <Link
        href={`/record/${novel.entry.id}`}
        className="mt-5 inline-flex text-sm text-bone/80 transition hover:text-bone"
      >
        Abrir novela
      </Link>
    </motion.article>
  );
}
