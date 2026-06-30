import type { Story } from "@/types/story";
import type { CSSProperties } from "react";
import { clientCoverImageSrc } from "@/lib/firebase/storage-url";

export function resolveStoryCoverSrc(story: Story): string | undefined {
  return clientCoverImageSrc(story.id, story.coverImageUrl);
}

export function storyCoverHeaderClass(story: Story, heightClass = "h-24"): string {
  if (resolveStoryCoverSrc(story)) {
    return `${heightClass} bg-cover bg-center relative overflow-hidden`;
  }
  return `${heightClass} bg-gradient-to-tr ${story.color || "from-indigo-600 to-sky-500"} relative`;
}

export function storyCoverHeaderStyle(story: Story): CSSProperties | undefined {
  const src = resolveStoryCoverSrc(story);
  if (!src) return undefined;
  return {
    backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.55), rgba(15,23,42,0.1)), url(${src})`,
  };
}
