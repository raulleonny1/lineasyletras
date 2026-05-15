"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postAuth } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

async function syncSuperuserSession() {
  await fetch("/api/auth/sync-superuser", { method: "POST" });
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNeedsActivation(false);

    const supabase = createClient();
    if (!supabase) {
      toast.error("Supabase no está configurado.");
      setLoading(false);
      return;
    }

    try {
      let { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error?.message.toLowerCase().includes("email not confirmed")) {
        await postAuth("/api/auth/activate", { email, password });
        ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      }

      if (error) {
        const message = getAuthErrorMessage(error.message);
        setNeedsActivation(
          error.message.toLowerCase().includes("email not confirmed") ||
            message.toLowerCase().includes("no está activa"),
        );
        toast.error(message);
        return;
      }

      await syncSuperuserSession();
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? getAuthErrorMessage(error.message) : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const activateWithoutEmail = async () => {
    if (!email || !password) {
      toast.error("Escribe correo y contraseña antes de activar la cuenta.");
      return;
    }

    setLoading(true);
    try {
      await postAuth("/api/auth/activate", { email, password });
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase no está configurado.");
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }

      await syncSuperuserSession();
      toast.success("Cuenta activada.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? getAuthErrorMessage(error.message) : "No se pudo activar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const supabase = createClient();
    if (!supabase) {
      toast.error("Supabase no está configurado.");
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
      <form
        onSubmit={signIn}
        className="glass-panel cinematic-shadow w-full max-w-md rounded-[1.75rem] p-8"
      >
        <h1 className="font-heading text-4xl text-bone">Acceso al archivo</h1>
        <p className="mt-3 text-sm text-bone/65">
          Inicia sesión para conservar progreso y desbloquear registros.
        </p>
        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-white/10 bg-black/20"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-white/10 bg-black/20"
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            Entrar
          </Button>
          {needsActivation ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              disabled={loading}
              onClick={activateWithoutEmail}
            >
              Activar sin correo
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={signInWithGoogle}
          >
            Continuar con Google
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-bone/55">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-bone hover:text-white">
            Regístrate
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-bone/55">
          <Link href="/archive" className="text-bone hover:text-white">
            Volver al archivo
          </Link>
        </p>
      </form>
    </section>
  );
}
