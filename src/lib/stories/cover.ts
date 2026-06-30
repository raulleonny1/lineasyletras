import type { Story } from "@/types/story";
import type { CSSProperties } from "react";

export function storyCoverHeaderClass(story: Story, heightClass = "h-24"): string {
  if (story.coverImageUrl) {
    return `${heightClass} bg-cover bg-center relative overflow-hidden`;
  }
  return `${heightClass} bg-gradient-to-tr ${story.color || "from-indigo-600 to-sky-500"} relative`;
}

export function storyCoverHeaderStyle(story: Story): CSSProperties | undefined {
  if (!story.coverImageUrl) return undefined;
  return {
    backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.55), rgba(15,23,42,0.1)), url(${story.coverImageUrl})`,
  };
}
