"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Story } from "@/types/story";
import { PublishFacebookModal } from "@/components/admin/publish-facebook-modal";

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [hasExamplesOnly, setHasExamplesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");
  const [facebookStory, setFacebookStory] = useState<Story | null>(null);

  async function loadStories() {
    const res = await fetch("/api/admin/stories");
    if (res.ok) {
      const data = await res.json();
      setStories(data.stories ?? []);
      setHasExamplesOnly(Boolean(data.hasExamplesOnly));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStories();
  }, []);

  async function handleSeed() {
    if (
      !confirm(
        "¿Importar las 3 historias de ejemplo a Firebase? Podrás editarlas, publicarlas y eliminarlas desde aquí."
      )
    ) {
      return;
    }
    setSeeding(true);
    setMessage("");
    const res = await fetch("/api/admin/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    });
    const data = await res.json();
    setSeeding(false);
    if (res.ok) {
      setMessageType("ok");
      setMessage(`✓ ${data.count} historias importadas a Firebase. Ya puedes editarlas.`);
      loadStories();
    } else {
      setMessageType("error");
      setMessage(
        data.error ||
          "Error al importar. Si usas reglas estrictas, añade FIREBASE_SERVICE_ACCOUNT_KEY en .env.local"
      );
    }
  }

  async function togglePublish(story: Story) {
    if (story.isExample) return;
    const willPublish = story.published === false;
    const res = await fetch(`/api/admin/stories/${story.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !story.published }),
    });
    if (res.ok) {
      await loadStories();
      if (willPublish) {
        setFacebookStory({ ...story, published: true });
      }
    }
  }

  async function togglePremium(story: Story) {
    if (story.isExample) return;
    const res = await fetch(`/api/admin/stories/${story.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ premium: !story.premium }),
    });
    if (res.ok) loadStories();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    const res = await fetch(`/api/admin/stories/${id}`, { method: "DELETE" });
    if (res.ok) loadStories();
  }

  const allTags = [...new Set(stories.flatMap((s) => s.tags))].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">Historias</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona todo lo publicable: historias, categorías y etiquetas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasExamplesOnly && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100"
            >
              {seeding ? "Importando..." : "Importar a Firebase"}
            </button>
          )}
          <Link
            href="/admin/escribir"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500"
          >
            + Escribir
          </Link>
        </div>
      </div>

      {hasExamplesOnly && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm p-4 rounded-xl space-y-1">
          <p className="font-semibold">Historias de ejemplo (solo lectura)</p>
          <p>
            Las 3 historias que ves en el inicio aún no están en Firebase. Pulsa{" "}
            <strong>Importar a Firebase</strong> para poder editarlas y gestionarlas desde el admin.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`text-sm p-3 rounded-xl border ${
            messageType === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message}
        </div>
      )}

      {allTags.length > 0 && !hasExamplesOnly && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase mb-2">Etiquetas en uso</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Link
                key={tag}
                href={`/etiqueta/${encodeURIComponent(tag.toLowerCase())}`}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 rounded-full border border-slate-200"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando historias...</p>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-600 font-medium">No hay historias todavía.</p>
          <p className="text-sm text-slate-400 mt-2">Crea una nueva desde Escribir.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto scroll-touch">
          <table className="w-full text-sm min-w-[32rem]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Título</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                  Categoría
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">
                  Etiquetas
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{story.title}</p>
                    <p className="text-xs text-slate-400">{story.author}</p>
                    <p className="text-xs text-indigo-600 mt-0.5 md:hidden">{story.category}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{story.category}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {story.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {story.isExample ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                          Ejemplo
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => togglePublish(story)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              story.published !== false
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {story.published !== false ? "Publicada" : "Borrador"}
                          </button>
                          {story.published !== false && (
                            <button
                              onClick={() => togglePremium(story)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                story.premium
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-500 hover:bg-amber-50"
                              }`}
                            >
                              {story.premium ? "✨ Premium" : "Marcar premium"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {story.isExample ? (
                      <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="text-amber-700 hover:underline text-xs font-semibold"
                      >
                        Importar
                      </button>
                    ) : (
                      <>
                        {story.published !== false && (
                          <button
                            type="button"
                            onClick={() => setFacebookStory(story)}
                            className="text-[#1877F2] hover:underline text-xs font-semibold"
                          >
                            Facebook
                          </button>
                        )}
                        <Link
                          href={`/admin/stories/${story.id}/edit`}
                          className="text-indigo-600 hover:underline text-xs font-semibold"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(story.id, story.title)}
                          className="text-rose-600 hover:underline text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {facebookStory && (
        <PublishFacebookModal
          storyId={facebookStory.id}
          title={facebookStory.title}
          summary={facebookStory.summary}
          coverImageUrl={facebookStory.coverImageUrl}
          onClose={() => setFacebookStory(null)}
        />
      )}
    </div>
  );
}
