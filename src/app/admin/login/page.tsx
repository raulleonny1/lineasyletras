"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LineasYLetrasLogo } from "@/components/brand/lineas-y-letras-logo";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-center">
          <p className="text-xs text-slate-600 leading-relaxed">
            Acceso solo para administradores. Escribe tu{" "}
            <strong>contraseña completa</strong> con el teclado normal — no es el código de 4
            dígitos de los lectores.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-sm p-3 rounded-xl border border-rose-200">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="admin-password" className="text-xs font-bold text-slate-500 uppercase">
              Contraseña de administrador
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                inputMode="text"
                autoComplete="current-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 font-mono text-base tracking-wide"
                placeholder="Tu contraseña (ej. admin123)"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar al panel"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 space-y-1">
          <span className="block">
            ¿Eres lector?{" "}
            <Link href="/cuenta/ingresar" className="text-indigo-600 font-semibold hover:underline">
              Ingresar con código de 4 dígitos
            </Link>
          </span>
          <Link href="/" className="inline-block mt-2 hover:text-indigo-600">
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
