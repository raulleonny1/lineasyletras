"use client";

import type { StoryFormat } from "@/types/story-format";
import { STORY_FORMAT_OPTIONS } from "@/types/story-format";

type Props = {
  value: StoryFormat;
  onChange: (format: StoryFormat) => void;
  disabled?: boolean;
};

export function StoryFormatPicker({ value, onChange, disabled = false }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase">Tipo de obra *</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {STORY_FORMAT_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selected
                  ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              } disabled:opacity-50`}
            >
              <span
                className={`block text-sm font-bold ${selected ? "text-indigo-800" : "text-slate-800"}`}
              >
                {option.label}
              </span>
              <span className="block text-[11px] text-slate-500 mt-1 leading-snug">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
