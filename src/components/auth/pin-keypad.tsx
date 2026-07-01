"use client";

type PinDotsProps = {
  length: number;
  max?: number;
};

export function PinDots({ length, max = 4 }: PinDotsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
            i < length
              ? "bg-slate-900 border-slate-900 scale-110"
              : "bg-transparent border-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

type PinKeypadProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
};

export function PinKeypad({ value, onChange, onComplete, disabled = false }: PinKeypadProps) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  function press(digit: string) {
    if (disabled || value.length >= 4) return;
    const next = value + digit;
    onChange(next);
    if (next.length === 4) onComplete?.(next);
  }

  function backspace() {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  }

  const keyClass =
    "h-14 sm:h-16 rounded-2xl bg-white text-2xl font-medium text-slate-900 shadow-[0_1px_0_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)] active:bg-slate-100 active:scale-[0.98] transition-all select-none touch-manipulation disabled:opacity-40";

  return (
    <div className="rounded-3xl bg-[#e8e8ed] p-3 sm:p-4 space-y-3">
      <PinDots length={value.length} />

      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => press(digit)}
            className={keyClass}
          >
            {digit}
          </button>
        ))}

        <div aria-hidden className="h-14 sm:h-16" />

        <button
          type="button"
          disabled={disabled}
          onClick={() => press("0")}
          className={keyClass}
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={backspace}
          aria-label="Borrar"
          className={`${keyClass} flex items-center justify-center text-lg font-semibold text-slate-600`}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
