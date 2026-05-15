"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CarouselNovel } from "@/types";
import { RecordCard } from "@/components/records/record-card";
import { cn } from "@/lib/utils";

interface RecordCarouselProps {
  novels: CarouselNovel[];
}

const AUTOPLAY_MS = 6000;

export function RecordCarousel({ novels }: RecordCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const go = (direction: -1 | 1) => {
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return novels.length - 1;
      if (next >= novels.length) return 0;
      return next;
    });
  };

  const select = (index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, novels.length);
  }, [novels.length]);

  useEffect(() => {
    if (novels.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % novels.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [novels.length, isPaused]);

  useEffect(() => {
    const target = itemRefs.current[activeIndex];
    target?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  if (!novels.length) {
    return null;
  }

  return (
    <section
      id="registros"
      className="relative px-4 py-16 sm:px-6 sm:py-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bone/45">Registros activos</p>
            <h2 className="mt-3 font-heading text-3xl text-bone sm:text-4xl md:text-5xl">
              Archivos en transmisión
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Novela anterior"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Siguiente novela"
              onClick={() => go(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto pb-4 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {novels.map((novel, index) => {
              const isCenter = index === activeIndex;

              return (
                <motion.div
                  key={novel.id}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  initial={false}
                  animate={{
                    opacity: isCenter ? 1 : 0.72,
                    scale: isCenter ? 1 : 0.92,
                  }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="snap-center"
                >
                  <RecordCard novel={novel} active={isCenter} onSelect={() => select(index)} />
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {novels.map((novel, index) => (
              <button
                key={novel.id}
                type="button"
                aria-label={`Mostrar ${novel.story_title}`}
                aria-current={index === activeIndex}
                onClick={() => select(index)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition sm:hidden",
                  index === activeIndex ? "bg-bone" : "bg-bone/25 hover:bg-bone/45",
                )}
              />
            ))}
          </div>

          <div
            role="tablist"
            aria-label="Seleccionar novela"
            className="hidden w-full flex-wrap items-center justify-center gap-2 sm:flex"
          >
            {novels.map((novel, index) => (
              <button
                key={novel.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                onClick={() => select(index)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  index === activeIndex
                    ? "border-white/20 bg-white/10 text-bone"
                    : "border-transparent text-bone/55 hover:border-white/10 hover:bg-white/5 hover:text-bone",
                )}
              >
                {novel.story_title}
              </button>
            ))}
          </div>

          <p className="text-xs uppercase tracking-[0.28em] text-bone/45">
            {activeIndex + 1} / {novels.length}
          </p>
        </div>
      </div>
    </section>
  );
}
