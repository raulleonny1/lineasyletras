"use client";

import type { Story } from "@/types/story";
import { isNovelStory } from "@/lib/stories/novel";

type Props = {
  story: Story;
  fontSize?: string;
};

export function NovelReaderContent({ story, fontSize = "text-base" }: Props) {
  if (!isNovelStory(story) || !story.novel) return null;

  return (
    <div className={`space-y-8 ${fontSize}`}>
      {story.novel.chapters.map((chapter, chapterIndex) => (
        <section key={chapter.id} className="space-y-5">
          <h3 className="text-xl md:text-2xl font-serif font-bold text-indigo-800 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-900 pb-2">
            {chapter.title.trim() || `Capítulo ${chapterIndex + 1}`}
          </h3>

          {chapter.scenes.map((scene, sceneIndex) => (
            <div key={scene.id} className="space-y-3">
              {scene.title.trim() && (
                <h4 className="text-lg font-serif font-semibold text-slate-700 dark:text-slate-300">
                  {scene.title}
                </h4>
              )}
              {!scene.title.trim() && chapter.scenes.length > 1 && (
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Escena {sceneIndex + 1}
                </p>
              )}
              <div className="space-y-4 leading-relaxed tracking-normal text-justify">
                {scene.content.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export function StoryReaderBody({
  story,
  fontSize = "text-base",
}: Props) {
  if (isNovelStory(story)) {
    return <NovelReaderContent story={story} fontSize={fontSize} />;
  }

  return (
    <div className={`space-y-5 leading-relaxed tracking-normal text-justify ${fontSize}`}>
      {story.content.split("\n\n").map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
