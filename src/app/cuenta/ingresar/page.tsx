"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { PinKeypad } from "@/components/auth/pin-keypad";
import { useUserAuth } from "@/components/providers/user-auth-provider";

export default function IngresarPage() {
  const router = useRouter();
  const { refresh } = useUserAuth();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitPin = useCallback(
    async (code: string) => {
      if (loading || code.length !== 4) return;
      setError("");
      setLoading(true);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: code }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "No se pudo iniciar sesión.");
          setPin("");
          return;
        }
        await refresh();
        router.push("/cuenta");
        router.refresh();
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
        setPin("");
      } finally {
        setLoading(false);
      }
    },
    [loading, refresh, router]
  );

  return (
    <AuthShell
      title="Ingresar"
      subtitle="Introduce tu código personal de 4 dígitos."
      footer={
        <p className="text-center text-sm text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link href="/cuenta/registro" className="text-indigo-600 font-semibold hover:underline">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-center text-sm text-indigo-600 font-medium">Verificando código...</p>
        )}

        <PinKeypad
          value={pin}
          onChange={setPin}
          onComplete={submitPin}
          disabled={loading}
        />
      </div>
    </AuthShell>
  );
}
