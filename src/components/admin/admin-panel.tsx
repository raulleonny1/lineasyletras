"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatTagsInput, parseTagsInput, slugifyTitle, validateRecordInput } from "@/lib/admin/record-input";
import { isCatalogImport, listDraftChapters } from "@/lib/admin/draft-stories";
import { getErrorMessage } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminRecord, SeasonCharacter, UserProfile } from "@/types";
import { UserRolesPanel } from "@/components/admin/user-roles-panel";
import { AdminSectionNav } from "@/components/admin/admin-section-nav";
import { SeasonCharactersPanel } from "@/components/admin/season-characters-panel";
import { RecordCoverUpload } from "@/components/admin/record-cover-upload";
import {
  createRecordAction,
  toggleFeaturedAction,
  togglePremiumAction,
  togglePublishAction,
  updateRecordAction,
} from "@/app/admin/actions";
import { cn } from "@/lib/utils";

interface AdminPanelProps {
  records: AdminRecord[];
  characters: SeasonCharacter[];
  users: UserProfile[];
  canManageRoles: boolean;
  initialEditingId?: string | null;
}

const emptyForm = {
  story_title: "",
  story_slug: "",
  season_title: "",
  season: 1,
  episode: 1,
  title: "",
  slug: "",
  synopsis: "",
  content: "",
  is_premium: false,
  published: false,
  featured: false,
  tagsInput: "",
  cover_url: "",
};

function parseCount(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function findSeasonTitle(records: AdminRecord[], season: number, storySlug: string) {
  const match = records.find((record) => {
    if (record.season !== season || record.season_title.trim().length === 0) {
      return false;
    }

    if (!storySlug) {
      return true;
    }

    return record.story_slug.trim() === storySlug;
  });

  return match?.season_title.trim() ?? "";
}

function findStorySlug(records: AdminRecord[], storyTitle: string) {
  const match = records.find(
    (record) => record.story_title.trim() === storyTitle.trim() && record.story_slug.trim().length > 0,
  );
  return match?.story_slug.trim() ?? "";
}

function matchesStoryRecord(
  record: AdminRecord,
  storySlug: string,
  storyTitle: string,
) {
  if (storySlug) {
    return record.story_slug.trim() === storySlug;
  }

  if (storyTitle) {
    return record.story_title.trim() === storyTitle.trim();
  }

  return false;
}

function findSeasonCover(
  records: AdminRecord[],
  season: number,
  storySlug: string,
  storyTitle: string,
) {
  const match = records
    .filter(
      (record) =>
        record.season === season &&
        Boolean(record.cover_url) &&
        matchesStoryRecord(record, storySlug, storyTitle),
    )
    .sort((left, right) => left.episode - right.episode)[0];

  return match?.cover_url ?? null;
}

export function AdminPanel({
  records,
  characters,
  users,
  canManageRoles,
  initialEditingId = null,
}: AdminPanelProps) {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugManual, setSlugManual] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverManuallyCleared, setCoverManuallyCleared] = useState(false);
  const [coverUploadEnabled, setCoverUploadEnabled] = useState(false);
  const [isNewNovelMode, setIsNewNovelMode] = useState(false);
  const [carryOverSource, setCarryOverSource] = useState<{ slug: string; title: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const novelOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ title: string; slug: string }> = [];

    for (const record of records) {
      const title = record.story_title.trim();
      const slug = record.story_slug.trim();
      if (!title || !slug || seen.has(slug)) {
        continue;
      }

      seen.add(slug);
      options.push({ title, slug });
    }

    return options.sort((left, right) => left.title.localeCompare(right.title, "es"));
  }, [records]);

  const draftChapters = useMemo(() => listDraftChapters(records), [records]);

  const listedRecords = useMemo(
    () => records.filter((record) => !isCatalogImport(record)),
    [records],
  );

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  useEffect(() => {
    const existingSeasonTitle = findSeasonTitle(records, form.season, form.story_slug);
    if (!existingSeasonTitle || isNewNovelMode) {
      return;
    }

    setForm((current) => {
      if (current.season !== form.season || current.season_title.trim().length > 0) {
        return current;
      }

      return { ...current, season_title: existingSeasonTitle };
    });
  }, [form.season, form.story_slug, records, isNewNovelMode]);

  useEffect(() => {
    const storyTitle = form.story_title.trim();
    if (!storyTitle) {
      return;
    }

    if (isNewNovelMode) {
      const slug = slugifyTitle(storyTitle);
      setForm((current) => (current.story_slug === slug ? current : { ...current, story_slug: slug }));
      return;
    }

    const canonicalSlug = findStorySlug(records, storyTitle) || slugifyTitle(storyTitle);
    setForm((current) => {
      if (current.story_slug === canonicalSlug) {
        return current;
      }

      return { ...current, story_slug: canonicalSlug };
    });
  }, [form.story_title, records, isNewNovelMode]);

  useEffect(() => {
    if (editingId || coverFile || coverManuallyCleared || isNewNovelMode) {
      return;
    }

    const inheritedCover = findSeasonCover(
      records,
      form.season,
      form.story_slug.trim(),
      form.story_title.trim(),
    );
    if (!inheritedCover) {
      return;
    }

    setForm((current) => {
      if (current.cover_url.trim().length > 0) {
        return current;
      }

      return { ...current, cover_url: inheritedCover };
    });
    setCoverPreview(inheritedCover);
    setCoverUploadEnabled(false);
  }, [
    editingId,
    coverFile,
    coverManuallyCleared,
    form.season,
    form.story_slug,
    form.story_title,
    form.cover_url,
    records,
  ]);

  const refreshCatalog = () => {
    router.refresh();
  };

  const startEdit = (record: AdminRecord) => {
    setIsNewNovelMode(false);
    setCarryOverSource(null);
    setEditingId(record.id);
    setSlugManual(false);
    setForm({
      story_title: record.story_title,
      story_slug: record.story_slug,
      season_title: record.season_title,
      season: record.season,
      episode: record.episode,
      title: record.title,
      slug: record.slug,
      synopsis: record.synopsis,
      content: record.content,
      is_premium: record.is_premium,
      published: record.published,
      featured: record.featured,
      tagsInput: formatTagsInput(record.tags),
      cover_url: record.cover_url ?? "",
    });
    setCoverFile(null);
    setCoverPreview(record.cover_url);
    setCoverManuallyCleared(false);
    setCoverUploadEnabled(false);

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (!initialEditingId || editingId === initialEditingId) {
      return;
    }

    const record = records.find((item) => item.id === initialEditingId);
    if (!record) {
      return;
    }

    setEditingId(record.id);
    setSlugManual(true);
    setForm({
      story_title: record.story_title,
      story_slug: record.story_slug,
      season_title: record.season_title,
      season: record.season,
      episode: record.episode,
      title: record.title,
      slug: record.slug,
      synopsis: record.synopsis,
      content: record.content,
      is_premium: record.is_premium,
      published: record.published,
      featured: record.featured,
      tagsInput: formatTagsInput(record.tags),
      cover_url: record.cover_url ?? "",
    });
    setCoverFile(null);
    setCoverPreview(record.cover_url);
    setCoverManuallyCleared(false);
    setCoverUploadEnabled(false);

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialEditingId, records, editingId]);

  const resetForm = () => {
    setEditingId(null);
    setSlugManual(false);
    setCoverFile(null);
    setCoverPreview(null);
    setCoverManuallyCleared(false);
    setCoverUploadEnabled(false);
    setIsNewNovelMode(false);
    setCarryOverSource(null);
    setForm(emptyForm);
  };

  const startNewNovel = () => {
    const slug = form.story_slug.trim();
    const title = form.story_title.trim();
    let source: { slug: string; title: string } | null = null;

    if (slug) {
      source = { slug, title: title || slug };
    } else if (novelOptions.length > 0) {
      const latest = novelOptions[novelOptions.length - 1];
      source = { slug: latest.slug, title: latest.title };
    }

    setCarryOverSource(source);
    setIsNewNovelMode(true);
    setEditingId(null);
    setSlugManual(false);
    setCoverFile(null);
    setCoverPreview(null);
    setCoverManuallyCleared(true);
    setCoverUploadEnabled(true);
    setForm(emptyForm);

    toast.message(
      source
        ? `Novela nueva. Escribe el título; luego podrás copiar los protagonistas de «${source.title}».`
        : "Novela nueva. Escribe el título de la obra y el primer capítulo.",
    );

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setCoverManuallyCleared(true);
    setCoverUploadEnabled(true);
    setForm((current) => ({ ...current, cover_url: "" }));
  };

  const onCoverSelected = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("La portada debe ser JPG, PNG o WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La portada no puede superar 5 MB.");
      return;
    }

    setCoverManuallyCleared(false);
    setCoverUploadEnabled(true);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const inheritedCoverUrl = useMemo(
    () =>
      findSeasonCover(
        records,
        form.season,
        form.story_slug.trim(),
        form.story_title.trim(),
      ),
    [records, form.season, form.story_slug, form.story_title],
  );

  const coverInherited =
    !isNewNovelMode &&
    !editingId &&
    !coverFile &&
    Boolean(inheritedCoverUrl) &&
    form.cover_url.trim() === inheritedCoverUrl &&
    !coverManuallyCleared;

  const submit = () => {
    startTransition(async () => {
      try {
        const { tagsInput, cover_url: storedCoverUrl, ...formValues } = form;
        let cover_url =
          storedCoverUrl.trim() ||
          findSeasonCover(
            records,
            form.season,
            form.story_slug.trim(),
            form.story_title.trim(),
          ) ||
          null;

        if (coverFile) {
          const uploadData = new FormData();
          uploadData.append("file", coverFile);
          if (editingId) {
            uploadData.append("recordId", editingId);
          }
          uploadData.append("slug", form.slug);

          const response = await fetch("/api/admin/record-cover", {
            method: "POST",
            body: uploadData,
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error ?? "No se pudo subir la portada.");
          }
          cover_url = data.url;
        }

        const payload = {
          ...formValues,
          story_slug: formValues.story_title.trim()
            ? slugifyTitle(formValues.story_title)
            : formValues.story_slug.trim(),
          tags: parseTagsInput(tagsInput),
          cover_url,
        };
        validateRecordInput(payload);
        if (editingId) {
          await updateRecordAction(editingId, payload);
          toast.success("Relato actualizado.");
        } else {
          await createRecordAction(payload);
          toast.success("Relato creado.");
        }
        resetForm();
        setIsNewNovelMode(false);
        setCarryOverSource(null);
        refreshCatalog();
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo guardar."));
      }
    });
  };

  const runMutation = (task: () => Promise<unknown>, successMessage: string) => {
    startTransition(async () => {
      try {
        await task();
        toast.success(successMessage);
        refreshCatalog();
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo actualizar."));
      }
    });
  };

  return (
    <>
      <AdminSectionNav showUsers={canManageRoles} />
      <div id="relatos-admin" className="mt-12 scroll-mt-24 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-bone sm:text-3xl">Relatos del archivo</h2>
              <p className="mt-2 text-sm text-bone/60">
                Capítulos guardados en la base de datos, publicados o en borrador. Los borradores
                también aparecen en{" "}
                <Link href="/admin/relatos" className="text-bone transition hover:text-bone/80">
                  Listado de relatos
                </Link>
                {draftChapters.length > 0 ? ` (${draftChapters.length} sin publicar).` : "."}
              </p>
            </div>
            <p className="text-sm text-bone/50">{listedRecords.length} relatos</p>
          </div>

          {listedRecords.length === 0 ? (
            <p className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5 text-sm text-bone/65">
              Todavía no hay relatos guardados en la base de datos.
            </p>
          ) : null}

          {listedRecords.map((record) => (
            <article
              key={record.id}
              className={cn(
                "rounded-[1.25rem] border bg-white/5 p-5 transition",
                editingId === record.id
                  ? "border-wine/40 ring-1 ring-wine/20"
                  : "border-white/10",
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  {record.story_title.trim().length > 0 ? (
                    <p className="text-xs uppercase tracking-[0.2em] text-bone/50">{record.story_title}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-2xl text-bone">{record.title}</h3>
                    {isCatalogImport(record) ? (
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-bone/55">
                        Catálogo inicial
                      </span>
                    ) : null}
                    {!record.published && !isCatalogImport(record) ? (
                      <span className="rounded-full border border-wine/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-bone/70">
                        Borrador
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-bone/60">
                    {record.published ? "Publicado" : "Borrador"} ·{" "}
                    {record.is_premium ? "Premium" : "Acceso libre"} ·{" "}
                    {record.featured ? "En carrusel" : "Fuera del carrusel"}
                  </p>
                  <p className="mt-2 text-xs text-bone/45">
                    {record.season_title.trim().length > 0
                      ? `Temporada ${record.season} · ${record.season_title} · Episodio ${record.episode}`
                      : `Temporada ${record.season} · Episodio ${record.episode}`}{" "}
                    · {record.slug}
                  </p>
                  {record.tags.length > 0 ? (
                    <p className="mt-2 text-xs text-bone/50">
                      {record.tags.map((tag) => `#${tag}`).join(" ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => startEdit(record)}>
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      runMutation(
                        () => togglePremiumAction(record.id, !record.is_premium),
                        record.is_premium
                          ? "Relato marcado como libre."
                          : "Relato marcado como premium.",
                      )
                    }
                  >
                    {record.is_premium ? "Marcar libre" : "Marcar premium"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      runMutation(
                        () => toggleFeaturedAction(record.id, !record.featured),
                        record.featured
                          ? "Relato quitado del carrusel."
                          : "Relato añadido al carrusel.",
                      )
                    }
                  >
                    {record.featured ? "Quitar del carrusel" : "Añadir al carrusel"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      runMutation(
                        () => togglePublishAction(record.id, !record.published),
                        record.published ? "Relato despublicado." : "Relato publicado.",
                      )
                    }
                  >
                    {record.published ? "Despublicar" : "Publicar"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section
          ref={formRef}
          className="glass-panel h-fit rounded-[1.5rem] p-6 xl:sticky xl:top-24"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl text-bone sm:text-3xl">
              {editingId ? "Editar relato" : isNewNovelMode ? "Nueva novela" : "Crear relato"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {!editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={startNewNovel}
                >
                  Crear nueva novela
                </Button>
              ) : null}
              {editingId || isNewNovelMode ? (
                <Button variant="outline" className="rounded-full" onClick={resetForm}>
                  {isNewNovelMode ? "Cancelar novela nueva" : "Nuevo relato"}
                </Button>
              ) : null}
            </div>
          </div>
          {isNewNovelMode ? (
            <p className="mt-3 rounded-[1rem] border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-bone/75">
              Formulario limpio para una obra nueva: temporada 1, episodio 1, sin portada heredada.
              {carryOverSource
                ? ` Puedes elegir protagonistas de «${carryOverSource.title}» o crear otros nuevos.`
                : ""}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-bone/60">
            {editingId
              ? "Modifica el relato seleccionado y guarda los cambios."
              : isNewNovelMode
                ? "Escribe el nombre de la nueva novela y el primer capítulo."
                : "Añade un relato nuevo al archivo."}
          </p>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="story_title">Nombre de la novela</Label>
              <Input
                id="story_title"
                list={isNewNovelMode ? undefined : "novel-options"}
                autoComplete={isNewNovelMode ? "off" : undefined}
                value={form.story_title}
                placeholder={isNewNovelMode ? "Nombre de la nueva novela" : "Ej. Archivum Noctis"}
                onChange={(event) => {
                  const story_title = event.target.value;
                  const story_slug = story_title.trim() ? slugifyTitle(story_title) : "";
                  setForm((current) => ({
                    ...current,
                    story_title,
                    story_slug: isNewNovelMode ? story_slug : story_slug,
                  }));
                }}
              />
              {!isNewNovelMode ? (
                <datalist id="novel-options">
                  {novelOptions.map((option) => (
                    <option key={option.slug} value={option.title} />
                  ))}
                </datalist>
              ) : null}
              <p className="text-xs text-bone/50">
                {isNewNovelMode
                  ? "Título distinto al de novelas anteriores. No se reutiliza portada ni datos de otra obra."
                  : "Agrupa todos los capítulos de la misma obra. Si eliges una novela existente, se reutiliza en todos sus capítulos al guardar."}
              </p>
            </div>
            <fieldset className="space-y-4 rounded-[1rem] border border-white/10 p-4">
              <legend className="px-1 text-sm font-medium text-bone">Temporada y episodio</legend>
              <div className="space-y-2">
                <Label htmlFor="season_title">Título de la temporada</Label>
                <Input
                  id="season_title"
                  value={form.season_title}
                  placeholder="Ej. Órbita silente"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, season_title: event.target.value }))
                  }
                />
                <p className="text-xs text-bone/50">
                  Se reutiliza en todos los capítulos de la misma temporada al guardar.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="season">Número de temporada</Label>
                  <Input
                    id="season"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={form.season}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        season: parseCount(event.target.value, current.season),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episode">Número de episodio o capítulo</Label>
                  <Input
                    id="episode"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={form.episode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        episode: parseCount(event.target.value, current.episode),
                      }))
                    }
                  />
                </div>
              </div>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="title">Título del capítulo o episodio</Label>
              <Input
                id="title"
                value={form.title}
                placeholder="Ej. Despertar sin reloj"
                onChange={(event) => {
                  const title = event.target.value;
                  setForm((current) => ({
                    ...current,
                    title,
                    slug: slugManual ? current.slug : slugifyTitle(title),
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugManual(true);
                  setForm((current) => ({ ...current, slug: event.target.value }));
                }}
              />
              {!slugManual ? (
                <p className="text-xs text-bone/50">Se genera automáticamente desde el título.</p>
              ) : null}
              {slugManual ? (
                <button
                  type="button"
                  className="text-xs text-bone/60 underline-offset-2 hover:text-bone hover:underline"
                  onClick={() => {
                    setSlugManual(false);
                    setForm((current) => ({
                      ...current,
                      slug: slugifyTitle(current.title),
                    }));
                  }}
                >
                  Regenerar slug desde el título
                </button>
              ) : null}
            </div>
            <RecordCoverUpload
              title={form.title}
              previewUrl={coverPreview}
              selectedFileName={coverFile?.name ?? null}
              hasStoredCover={Boolean(form.cover_url)}
              inherited={coverInherited}
              showUploadControls={coverUploadEnabled || !coverInherited}
              onEnableUpload={() => setCoverUploadEnabled(true)}
              onSelect={onCoverSelected}
              onClear={clearCover}
            />
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                value={form.tagsInput}
                placeholder="#misterio #radio temporada-1"
                onChange={(event) =>
                  setForm((current) => ({ ...current, tagsInput: event.target.value }))
                }
              />
              <p className="text-xs text-bone/50">
                Separa con espacios o comas. Se normalizan en minúsculas sin acentos.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="synopsis">Sinopsis</Label>
              <Textarea
                id="synopsis"
                value={form.synopsis}
                onChange={(event) =>
                  setForm((current) => ({ ...current, synopsis: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                className="min-h-48"
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
              />
            </div>
            <SeasonCharactersPanel
              key={isNewNovelMode ? `new-${carryOverSource?.slug ?? "none"}` : `novel-${form.story_slug}`}
              season={form.season}
              storySlug={form.story_slug}
              storyTitle={form.story_title}
              characters={characters}
              carryOverSource={isNewNovelMode ? carryOverSource : null}
              strictNovelFilter={isNewNovelMode}
              isNewNovelMode={isNewNovelMode}
            />
            <fieldset className="space-y-3 rounded-[1rem] border border-white/10 p-4">
              <legend className="px-1 text-sm font-medium text-bone">Acceso al relato</legend>
              <label className="flex items-center gap-2 text-sm text-bone/70">
                <input
                  type="radio"
                  name="record-access"
                  checked={!form.is_premium}
                  onChange={() => setForm((current) => ({ ...current, is_premium: false }))}
                />
                Libre
              </label>
              <label className="flex items-center gap-2 text-sm text-bone/70">
                <input
                  type="radio"
                  name="record-access"
                  checked={form.is_premium}
                  onChange={() => setForm((current) => ({ ...current, is_premium: true }))}
                />
                Premium
              </label>
            </fieldset>
            <fieldset className="space-y-3 rounded-[1rem] border border-white/10 p-4">
              <legend className="px-1 text-sm font-medium text-bone">Publicación y carrusel</legend>
              <label className="flex items-center gap-2 text-sm text-bone/70">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, published: event.target.checked }))
                  }
                />
                Publicar
              </label>
              <label className="flex items-center gap-2 text-sm text-bone/70">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, featured: event.target.checked }))
                  }
                />
                Mostrar en carrusel de inicio
              </label>
              <p className="text-xs leading-relaxed text-bone/50">
                Puedes cargar todos los capítulos como borrador y publicar solo el que toque. El archivo y
                el lector muestran únicamente episodios publicados; Continuar avanza por temporada y
                episodio. El carrusel solo incluye relatos publicados y marcados para inicio.
              </p>
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full" disabled={pending} onClick={submit}>
                {editingId ? "Guardar cambios" : "Crear relato"}
              </Button>
              {editingId ? (
                <Button variant="outline" className="rounded-full" onClick={resetForm}>
                  Cancelar edición
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
      {canManageRoles ? <UserRolesPanel users={users} /> : null}
    </>
  );
}
