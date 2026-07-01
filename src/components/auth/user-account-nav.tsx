"use client";

import Link from "next/link";
import { useUserAuth } from "@/components/providers/user-auth-provider";

type Props = {
  compact?: boolean;
};

export function UserAccountNav({ compact = false }: Props) {
  const { user, loading, logout } = useUserAuth();

  if (loading) {
    return <span className="text-xs text-slate-400">...</span>;
  }

  if (user) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "flex-col" : ""}`}>
        <Link
          href="/cuenta"
          className={`font-semibold text-indigo-600 hover:text-indigo-500 transition-colors ${compact ? "text-[10px]" : "text-sm"}`}
        >
          {compact ? "📚" : "Mi biblioteca"}
        </Link>
        <span
          className={`text-sm font-semibold text-slate-700 truncate max-w-[8rem] ${compact ? "text-[10px] max-w-[5rem]" : ""}`}
          title={`${user.firstName} ${user.lastName}`}
        >
          {compact ? "👤" : `👤 ${user.firstName}`}
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          className={`text-slate-500 hover:text-rose-600 font-semibold transition-colors ${compact ? "text-[10px]" : "text-xs"}`}
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? "gap-1" : ""}`}>
      <Link
        href="/cuenta/ingresar"
        className={`font-semibold text-slate-600 hover:text-indigo-600 transition-colors ${compact ? "text-[10px] px-2 py-1" : "text-sm px-3 py-2 rounded-xl hover:bg-slate-100"}`}
      >
        Ingresar
      </Link>
      <Link
        href="/cuenta/registro"
        className={`font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors ${compact ? "text-[10px] px-2 py-1 rounded-lg" : "text-sm px-3 py-2 rounded-xl"}`}
      >
        Registro
      </Link>
    </div>
  );
}
