"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LineasYLetrasLogo } from "@/components/brand/lineas-y-letras-logo";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin/stories";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Contraseña incorrecta");
      return;
    }

    router.push(from);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900 flex items-center justify-center px-4 safe-top safe-bottom">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <LineasYLetrasLogo className="w-16 h-16" />
          <h1 className="text-2xl font-bold font-serif text-slate-900">Panel de administración</h1>
          <p className="text-sm text-slate-500">Líneas y Letras</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-sm p-3 rounded-xl border border-rose-200">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
              placeholder="Tu contraseña de admin"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-indigo-600">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
