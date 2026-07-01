"use client";

import Link from "next/link";
import { LineasYLetrasLogo } from "@/components/brand/lineas-y-letras-logo";
import { useUserAuth } from "@/components/providers/user-auth-provider";

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function CuentaShell({ children, actions }: Props) {
  const { user, logout } = useUserAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <LineasYLetrasLogo className="w-9 h-9 shrink-0" />
            <div className="min-w-0">
              <span className="font-serif font-bold text-slate-900 block truncate">Líneas y Letras</span>
              {user && (
                <span className="text-[11px] text-slate-500 truncate block">
                  Hola, {user.firstName}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {actions}
            <Link
              href="/"
              className="hidden sm:inline text-sm text-indigo-600 font-semibold hover:underline"
            >
              Explorar
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs sm:text-sm text-slate-500 hover:text-rose-600 font-semibold"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
