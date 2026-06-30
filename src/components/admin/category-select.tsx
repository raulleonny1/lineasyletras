"use client";

import { useEffect, useState } from "react";
import { normalizeCategoryName } from "@/lib/categories";

const NEW_CATEGORY_VALUE = "__new__";

type CategorySelectProps = {
  value: string;
  onChange: (category: string) => void;
};

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCategories() {
    const res = await fetch("/api/categories");
    if (res.ok) {
      const data = await res.json();
      let list: string[] = data.categories ?? [];
      if (value && value !== NEW_CATEGORY_VALUE && !list.includes(value)) {
        list = [...list, value].sort((a, b) => a.localeCompare(b, "es"));
      }
      setCategories(list);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectChange(next: string) {
    if (next === NEW_CATEGORY_VALUE) {
      setIsCreating(true);
      setNewName("");
      setError("");
      return;
    }
    setIsCreating(false);
    onChange(next);
  }

  async function handleCreateCategory() {
    const normalized = normalizeCategoryName(newName);
    if (!normalized) {
      setError("Escribe un nombre para la categoría.");
      return;
    }

    if (categories.includes(normalized)) {
      onChange(normalized);
      setIsCreating(false);
      setNewName("");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: normalized }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "No se pudo crear la categoría");
      return;
    }

    await loadCategories();
    onChange(normalized);
    setIsCreating(false);
    setNewName("");
  }

  return (
    <div className="space-y-2">
      <select
        value={isCreating ? NEW_CATEGORY_VALUE : value}
        onChange={(e) => handleSelectChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
      >
        {loading ? (
          <option>Cargando categorías...</option>
        ) : (
          <>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value={NEW_CATEGORY_VALUE}>+ Crear nueva categoría...</option>
          </>
        )}
      </select>

      {isCreating && (
        <div className="flex flex-col sm:flex-row gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la nueva categoría"
            className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateCategory();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Añadir"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewName("");
                setError("");
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
