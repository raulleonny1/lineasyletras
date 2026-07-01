import Link from "next/link";
import { LineasYLetrasLogo } from "@/components/brand/lineas-y-letras-logo";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <LineasYLetrasLogo className="w-9 h-9 shrink-0" />
            <span className="font-serif font-bold text-slate-900 truncate">Líneas y Letras</span>
          </Link>
          <Link href="/" className="text-sm text-indigo-600 font-semibold hover:underline shrink-0">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold font-serif text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
          {footer}
        </div>
      </main>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

const labelClass = "text-xs font-bold text-slate-500 uppercase block mb-1";

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export { inputClass };
