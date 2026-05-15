"use client";

import { useEffect, useState } from "react";

export function useLocalCollection<T>(key: string, initial: T[] = []) {
  const [items, setItems] = useState<T[]>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        setItems(JSON.parse(stored) as T[]);
      } catch {
        setItems(initial);
      }
    }
    setReady(true);
    // `initial` is only a parse fallback; persisting it would overwrite stored data.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by storage namespace only
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [items, key, ready]);

  return { items, setItems, ready };
}

export function useReadingProgress() {
  const { items, setItems, ready } = useLocalCollection<{
    storySlug: string;
    episodeSlug: string;
    percent: number;
    updatedAt: string;
  }>("archivo-reading-progress");

  const saveProgress = (
    storySlug: string,
    episodeSlug: string,
    percent: number,
  ) => {
    setItems((current) => {
      const others = current.filter((item) => item.storySlug !== storySlug);
      return [
        {
          storySlug,
          episodeSlug,
          percent,
          updatedAt: new Date().toISOString(),
        },
        ...others,
      ];
    });
  };

  const getProgress = (storySlug: string) =>
    items.find((item) => item.storySlug === storySlug);

  return { items, saveProgress, getProgress, ready };
}
