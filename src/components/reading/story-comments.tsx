"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { StoryComment } from "@/types/comment";

type Props = {
  storyId: string;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function StoryComments({ storyId }: Props) {
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("lineas_letras_comment_name");
    if (savedName) setAuthorName(savedName);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stories/${storyId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [storyId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo publicar el comentario");
        return;
      }

      localStorage.setItem("lineas_letras_comment_name", authorName);
      setComments((prev) => [data.comment, ...prev]);
      setText("");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-5">
      <div>
        <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
          Comentarios
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Comparte qué te ha dejado esta historia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={60}
            required
            className="sm:col-span-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu comentario..."
            maxLength={800}
            required
            rows={3}
            className="sm:col-span-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {submitting ? "Publicando..." : "Publicar comentario"}
        </button>
      </form>

      <div className="space-y-4 pt-2">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando comentarios...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            Sé el primero en dejar un comentario.
          </p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {comment.authorName}
                </span>
                <time className="text-[10px] text-slate-400 uppercase tracking-wide">
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {comment.text}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
