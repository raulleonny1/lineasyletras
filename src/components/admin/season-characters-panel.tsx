"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { CharacterPortrait } from "@/components/characters/character-portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SeasonCharacter } from "@/types";
import {
  copyProtagonistsAction,
  createCharacterAction,
  deleteCharacterAction,
  toggleCharacterPublishAction,
  updateCharacterAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/supabase/errors";

interface SeasonCharactersPanelProps {
  season: number;
  storySlug: string;
  storyTitle: string;
  characters: SeasonCharacter[];
  carryOverSource?: { slug: string; title: string } | null;
  strictNovelFilter?: boolean;
  isNewNovelMode?: boolean;
}

const emptyCharacter = {
  name: "",
  role: "",
  description: "",
  published: false,
  image_url: "",
};

export function SeasonCharactersPanel({
  season,
  storySlug,
  storyTitle,
  characters,
  carryOverSource = null,
  strictNovelFilter = false,
  isNewNovelMode = false,
}: SeasonCharactersPanelProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCharacter);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  const sourceCandidates = useMemo(() => {
    if (!carryOverSource) {
      return [];
    }

    return characters.filter((character) => {
      if (character.season !== season) {
        return false;
      }

      const characterSlug = character.story_slug.trim();
      return characterSlug === carryOverSource.slug || characterSlug.length === 0;
    });
  }, [characters, season, carryOverSource]);

  const seasonCharacters = useMemo(
    () =>
      characters.filter((character) => {
        if (character.season !== season) {
          return false;
        }

        const slug = storySlug.trim();
        if (strictNovelFilter) {
          if (!slug) {
            return false;
          }

          return character.story_slug.trim() === slug;
        }

        if (!slug) {
          return character.story_slug.trim().length === 0;
        }

        const characterSlug = character.story_slug.trim();
        return characterSlug === slug || characterSlug.length === 0;
      }),
    [characters, season, storySlug, strictNovelFilter],
  );

  useEffect(() => {
    setSelectedSourceIds([]);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setForm(emptyCharacter);
  }, [carryOverSource?.slug, isNewNovelMode]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const toggleSourceSelection = (characterId: string) => {
    setSelectedSourceIds((current) =>
      current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId],
    );
  };

  const copySelectedProtagonists = () => {
    if (!carryOverSource || !storySlug.trim()) {
      return;
    }

    if (selectedSourceIds.length === 0) {
      toast.error("Marca al menos un protagonista de la novela anterior o crea uno nuevo.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await copyProtagonistsAction(
          carryOverSource.slug,
          storySlug.trim(),
          season,
          selectedSourceIds,
        );
        toast.success(
          result.copied > 0
            ? `${result.copied} protagonista${result.copied === 1 ? "" : "s"} añadido${result.copied === 1 ? "" : "s"} a esta novela.`
            : "Esos protagonistas ya estaban en esta novela.",
        );
        setSelectedSourceIds([]);
        refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudieron copiar los protagonistas."));
      }
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setForm(emptyCharacter);
  };

  const refresh = () => {
    router.refresh();
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((current) => ({ ...current, image_url: "" }));
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const onImageSelected = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("La foto debe ser JPG, PNG o WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La foto no puede superar 5 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submit = () => {
    if (!storySlug.trim()) {
      toast.error("Escribe el nombre de la novela antes de añadir personajes.");
      return;
    }

    startTransition(async () => {
      try {
        const { image_url: storedImageUrl, ...formValues } = form;
        let image_url = storedImageUrl.trim() || null;

        if (imageFile) {
          const uploadData = new FormData();
          uploadData.append("file", imageFile);
          if (editingId) {
            uploadData.append("characterId", editingId);
          }
          uploadData.append("season", String(season));
          uploadData.append("name", form.name);

          const response = await fetch("/api/admin/character-image", {
            method: "POST",
            body: uploadData,
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error ?? "No se pudo subir la foto del personaje.");
          }
          image_url = data.url;
        }

        const payload = { ...formValues, season, story_slug: storySlug.trim(), image_url };
        if (editingId) {
          await updateCharacterAction(editingId, payload);
          toast.success("Personaje actualizado.");
        } else {
          await createCharacterAction(payload);
          toast.success("Personaje creado.");
        }
        resetForm();
        refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo guardar el personaje."));
      }
    });
  };

  const startEdit = (character: SeasonCharacter) => {
    setEditingId(character.id);
    setImageFile(null);
    setImagePreview(character.image_url);
    setForm({
      name: character.name,
      role: character.role,
      description: character.description,
      published: character.published,
      image_url: character.image_url ?? "",
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  return (
    <fieldset
      id="personajes-temporada"
      className="scroll-mt-24 space-y-4 rounded-[1rem] border border-wine/30 bg-wine/5 p-4"
    >
      <legend className="px-1 text-sm font-medium text-bone">
        Personajes · {storyTitle.trim() || "Sin novela"} · Temporada {season}
      </legend>
      <p className="text-sm text-bone/70">
        {isNewNovelMode
          ? "La novela nueva empieza sin personajes. Puedes traer algunos de la obra anterior o crear otros nuevos."
          : "Los personajes pertenecen a esta novela y temporada. En cada ficha usa Subir foto del personaje y luego Añadir o Guardar."}
      </p>

      {!storySlug.trim() ? (
        <p className="text-sm text-amber-200/80">
          Escribe primero el nombre de la novela en el formulario para gestionar sus personajes.
        </p>
      ) : null}

      {isNewNovelMode && carryOverSource && storySlug.trim() && sourceCandidates.length > 0 ? (
        <div className="space-y-3 rounded-[1rem] border border-white/15 bg-black/25 p-4">
          <div>
            <h3 className="font-heading text-lg text-bone">
              Protagonistas de «{carryOverSource.title}»
            </h3>
            <p className="mt-1 text-sm text-bone/60">
              Marca solo los que quieras en la nueva novela. Los demás no se copian; puedes crear
              personajes nuevos más abajo.
            </p>
          </div>
          <ul className="space-y-2">
            {sourceCandidates.map((character) => {
              const checked = selectedSourceIds.includes(character.id);
              return (
                <li key={character.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-[0.85rem] border border-white/10 bg-white/5 p-3 transition hover:border-white/20">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => toggleSourceSelection(character.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-bone">{character.name}</span>
                      {character.role ? (
                        <span className="mt-0.5 block text-sm text-bone/55">{character.role}</span>
                      ) : null}
                    </span>
                    <CharacterPortrait
                      name={character.name}
                      imageUrl={character.image_url}
                      className="w-14 shrink-0"
                    />
                  </label>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={pending}
            onClick={copySelectedProtagonists}
          >
            Añadir seleccionados a esta novela
          </Button>
        </div>
      ) : isNewNovelMode && carryOverSource && storySlug.trim() ? (
        <p className="text-sm text-bone/60">
          La novela «{carryOverSource.title}» no tiene personajes en la temporada {season}. Crea
          personajes nuevos abajo.
        </p>
      ) : null}

      {storySlug.trim() ? (
        <>
          <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-bone/50">
            Personajes de esta novela
          </h3>
          {seasonCharacters.length === 0 ? (
            <p className="text-sm text-bone/60">
              {isNewNovelMode
                ? "Aún no hay personajes en esta novela. Elige algunos arriba o crea uno nuevo."
                : "Todavía no hay personajes para esta temporada."}
            </p>
          ) : (
        <div className="space-y-3">
          {seasonCharacters.map((character) => (
            <article
              key={character.id}
              className="rounded-[1rem] border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 gap-4">
                  <CharacterPortrait
                    name={character.name}
                    imageUrl={character.image_url}
                    className="w-24 shrink-0 sm:w-28"
                  />
                  <div className="min-w-0">
                    <h3 className="font-heading text-xl text-bone">{character.name}</h3>
                    {character.role ? (
                      <p className="mt-1 text-sm text-bone/60">{character.role}</p>
                    ) : null}
                    {character.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-bone/65">
                        {character.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-bone/45">
                      {character.published ? "Visible para lectores" : "Borrador"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(character)}>
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await toggleCharacterPublishAction(
                            character.id,
                            season,
                            !character.published,
                          );
                          toast.success(
                            character.published
                              ? "Personaje ocultado."
                              : "Personaje publicado.",
                          );
                          refresh();
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "No se pudo actualizar.",
                          );
                        }
                      })
                    }
                  >
                    {character.published ? "Ocultar" : "Publicar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await deleteCharacterAction(character.id, season);
                          if (editingId === character.id) {
                            resetForm();
                          }
                          toast.success("Personaje eliminado.");
                          refresh();
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "No se pudo eliminar.",
                          );
                        }
                      })
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
          )}

      <div className="space-y-4 rounded-[1rem] border border-white/15 bg-black/20 p-4">
        <h3 className="font-heading text-lg text-bone">
          {editingId ? "Editar personaje" : "Nuevo personaje"}
        </h3>

        <div className="space-y-3 rounded-[1rem] border-2 border-dashed border-wine/40 bg-black/30 p-4">
          <Label htmlFor="character-image" className="text-base text-bone">
            Foto del personaje
          </Label>
          <p className="text-xs text-bone/55">
            Retrato 3:4 en JPG, PNG o WebP. Máximo 5 MB.
          </p>
          <CharacterPortrait
            name={form.name || "Vista previa"}
            imageUrl={imagePreview}
            className="max-w-[12rem]"
          />
          <input
            ref={imageInputRef}
            id="character-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => onImageSelected(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="rounded-full" onClick={() => imageInputRef.current?.click()}>
              <ImageUp className="h-4 w-4" />
              {imagePreview || form.image_url ? "Cambiar foto del personaje" : "Subir foto del personaje"}
            </Button>
            {imagePreview || form.image_url ? (
              <Button type="button" variant="outline" className="rounded-full" onClick={clearImage}>
                Quitar foto
              </Button>
            ) : null}
          </div>
          {imageFile ? (
            <p className="text-xs text-bone/55">Archivo seleccionado: {imageFile.name}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="character-name">Nombre</Label>
          <Input
            id="character-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="character-role">Rol o función</Label>
          <Input
            id="character-role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="character-description">Descripción</Label>
          <Textarea
            id="character-description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-bone/70">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) =>
              setForm((current) => ({ ...current, published: event.target.checked }))
            }
          />
          Publicar personaje
        </label>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" size="sm" disabled={pending} onClick={submit}>
            {editingId ? "Guardar personaje" : "Añadir personaje"}
          </Button>
          {editingId ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={resetForm}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </div>
        </>
      ) : null}
    </fieldset>
  );
}
