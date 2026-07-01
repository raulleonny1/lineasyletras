"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Story } from "@/types/story";
import type { UserLibraryResponse } from "@/types/user-library";
import { CuentaShell } from "@/components/cuenta/cuenta-shell";
import { LibraryStoryItem } from "@/components/cuenta/library-story-item";
import { UserStoryEditor } from "@/components/cuenta/user-story-editor";
import { useUserAuth } from "@/components/providers/user-auth-provider";

export function UserLibraryDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useUserAuth();

  const [library, setLibrary] = useState<UserLibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadLibrary = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/user/library", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/cuenta/ingresar");
        return;
      }
      if (!res.ok) {
        setError("No se pudo cargar tu biblioteca.");
        return;
      }
      const data = (await res.json()) as UserLibraryResponse;
      setLibrary(data);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/cuenta/ingresar");
      return;
    }
    void loadLibrary();
  }, [authLoading, user, router, loadLibrary]);

  useEffect(() => {
    function onFocus() {
      if (user && !createOpen) void loadLibrary();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, createOpen, loadLibrary]);

  async function markReadAndGo(storyId: string) {
    try {
      await fetch("/api/user/library/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
    } catch {
      /* no bloquear navegación */
    }
    router.push(`/historia/${storyId}`);
  }

  function handleStorySaved(story: Story) {
    setLibrary((prev) =>
      prev
        ? {
            ...prev,
            myStories: [story, ...prev.myStories.filter((s) => s.id !== story.id)],
          }
        : prev
    );
    void loadLibrary();
  }

  const createButton = (
    <button
      type="button"
      onClick={() => setCreateOpen((v) => !v)}
      className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors ${
        createOpen
          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
          : "bg-indigo-600 text-white hover:bg-indigo-500"
      }`}
    >
      {createOpen ? "← Biblioteca" : "✍️ Crear historia"}
    </button>
  );

  if (authLoading || (!user && loading)) {
    return (
      <CuentaShell>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Cargando…</div>
      </CuentaShell>
    );
  }

  if (createOpen && user) {
    return (
      <CuentaShell actions={createButton}>
        <div className="h-[calc(100vh-57px)] min-h-[480px]">
          <UserStoryEditor
            authorName={`${user.firstName} ${user.lastName}`.trim()}
            onSaved={handleStorySaved}
            onClose={() => setCreateOpen(false)}
          />
        </div>
      </CuentaShell>
    );
  }

  const stats = library?.stats;
  const recommended = library?.recommended;
  const unread = library?.unreadStories ?? [];
  const read = library?.readStories ?? [];
  const myStories = library?.myStories ?? [];

  return (
    <CuentaShell actions={createButton}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">Mi biblioteca</h1>
          <p className="text-sm text-slate-500">
            Tu progreso de lectura se guarda automáticamente al abrir cada historia.
          </p>
          {stats && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                {stats.readCount} leídas
              </span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {stats.unreadCount} por leer
              </span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {stats.total} en catálogo
              </span>
            </div>
          )}
        </header>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm">Cargando historias…</p>
        ) : (
          <>
            {/* Siguiente recomendada */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Tu siguiente lectura
              </h2>
              {recommended ? (
                <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-1">
                  <LibraryStoryItem
                    story={recommended}
                    badge="Recomendada"
                    onRead={() => void markReadAndGo(recommended.id)}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
                  {read.length > 0
                    ? "¡Has leído todas las historias del catálogo! Vuelve pronto por nuevas."
                    : "Explora el catálogo y empieza tu primera lectura."}
                </div>
              )}
            </section>

            {/* Por leer */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Por leer ({unread.length})
              </h2>
              {unread.length > 0 ? (
                <div className="space-y-2">
                  {unread.slice(0, 8).map((story) => (
                    <LibraryStoryItem
                      key={story.id}
                      story={story}
                      compact
                      onRead={() => void markReadAndGo(story.id)}
                    />
                  ))}
                  {unread.length > 8 && (
                    <p className="text-xs text-slate-400 text-center pt-2">
                      +{unread.length - 8} historias más en el catálogo
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-100 p-4">
                  No tienes historias pendientes.
                </p>
              )}
            </section>

            {/* Ya leídas */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Ya leídas ({read.length})
              </h2>
              {read.length > 0 ? (
                <div className="space-y-2">
                  {read.slice(0, 6).map((story) => (
                    <LibraryStoryItem key={story.id} story={story} compact />
                  ))}
                  {read.length > 6 && (
                    <p className="text-xs text-slate-400 text-center pt-2">
                      +{read.length - 6} historias más leídas
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-100 p-4">
                  Aún no has leído ninguna historia. Empieza con la recomendada de arriba.
                </p>
              )}
            </section>

            {/* Mis borradores */}
            {myStories.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Mis historias ({myStories.length})
                </h2>
                <div className="space-y-2">
                  {myStories.map((story) => (
                    <article
                      key={story.id}
                      className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-serif font-bold text-slate-900 truncate">{story.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {story.published ? "Publicada" : "Borrador privado"} · {story.readTime}
                        </p>
                      </div>
                      {story.published && (
                        <button
                          type="button"
                          onClick={() => void markReadAndGo(story.id)}
                          className="text-xs font-bold text-indigo-600 hover:underline shrink-0"
                        >
                          Ver
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </CuentaShell>
  );
}
