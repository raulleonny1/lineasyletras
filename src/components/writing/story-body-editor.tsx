"use client";

import type { StoryFormat, NovelChapter } from "@/types/story-format";
import { StoryFormatPicker } from "@/components/writing/story-format-picker";
import { NovelStructureEditor } from "@/components/writing/novel-structure-editor";
import { isNovelFormat } from "@/lib/stories/novel";
import { computeReadTime } from "@/lib/stories/utils";

type Props = {
  format: StoryFormat;
  onFormatChange: (format: StoryFormat) => void;
  content: string;
  onContentChange: (content: string) => void;
  chapters: NovelChapter[];
  onChaptersChange: (chapters: NovelChapter[]) => void;
  disabled?: boolean;
  textareaRows?: number;
  inputClass?: string;
};

const defaultInputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-serif leading-relaxed";

export function StoryBodyEditor({
  format,
  onFormatChange,
  content,
  onContentChange,
  chapters,
  onChaptersChange,
  disabled = false,
  textareaRows = 14,
  inputClass = defaultInputClass,
}: Props) {
  return (
    <div className="space-y-4">
      <StoryFormatPicker value={format} onChange={onFormatChange} disabled={disabled} />

      {isNovelFormat(format) ? (
        <NovelStructureEditor
          chapters={chapters}
          onChange={onChaptersChange}
          disabled={disabled}
          inputClass={inputClass.replace("px-4 py-3", "px-3 py-2.5").replace("text-base", "text-sm")}
        />
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Contenido *</label>
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={textareaRows}
            disabled={disabled}
            className={inputClass}
            required={!isNovelFormat(format)}
          />
          <p className="text-xs text-slate-400 text-right">
            {content.trim() ? content.trim().split(/\s+/).length : 0} palabras ·{" "}
            {computeReadTime(content)}
          </p>
        </div>
      )}
    </div>
  );
}
