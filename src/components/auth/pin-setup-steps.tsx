"use client";

type PinSetupStepsProps = {
  step: "create" | "confirm";
  pinReady: boolean;
};

export function PinSetupSteps({ step, pinReady }: PinSetupStepsProps) {
  const steps = [
    { id: "create" as const, number: 1, title: "Elige tu código", hint: "4 dígitos nuevos" },
    { id: "confirm" as const, number: 2, title: "Confirma el código", hint: "Los mismos 4 dígitos" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-center">
        <p className="text-sm font-semibold text-indigo-900">
          {step === "create"
            ? "Paso 1 de 2 — Crea tu código de acceso"
            : "Paso 2 de 2 — Repite el mismo código"}
        </p>
        <p className="text-xs text-indigo-700/90 mt-0.5">
          {step === "create"
            ? "Lo usarás cada vez que ingreses. Después tendrás que escribirlo otra vez para confirmarlo."
            : "Debe ser exactamente el mismo que acabas de elegir."}
        </p>
      </div>

      <ol className="grid grid-cols-2 gap-2">
        {steps.map((item) => {
          const isActive = step === item.id;
          const isDone = item.id === "create" && (step === "confirm" || pinReady);

          return (
            <li
              key={item.id}
              className={`rounded-xl border px-3 py-2.5 transition-all ${
                isActive
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? "✓" : item.number}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{item.title}</p>
                  <p
                    className={`text-[10px] truncate ${isActive ? "text-indigo-100" : "opacity-80"}`}
                  >
                    {item.hint}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
