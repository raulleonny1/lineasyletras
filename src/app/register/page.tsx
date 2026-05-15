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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      toast.error("Supabase no está configurado.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session) {
        await postAuth("/api/auth/activate", { email, password });
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw new Error(signInError.message);
        }
      }

      await syncSuperuserSession();
      toast.success("Cuenta creada.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? getAuthErrorMessage(error.message) : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
      <form
        onSubmit={signUp}
        className="glass-panel cinematic-shadow w-full max-w-md rounded-[1.75rem] p-8"
      >
        <h1 className="font-heading text-4xl text-bone">Crear cuenta</h1>
        <p className="mt-3 text-sm text-bone/65">
          Regístrate para guardar progreso y acceder a tu expediente.
        </p>
        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border-white/10 bg-black/20"
            />
          </div>
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
            Registrarse
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-bone/55">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-bone hover:text-white">
            Inicia sesión
          </Link>
        </p>
      </form>
    </section>
  );
}
