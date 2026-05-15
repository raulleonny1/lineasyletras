"use server";

import { revalidatePath } from "next/cache";
import { requireStaffProfile, requireSuperuserProfile } from "@/lib/auth/guards";
import { validateRecordInput } from "@/lib/admin/record-input";
import {
  copyProtagonistsToNovel,
  deleteCharacter,
  saveCharacter,
  setCharacterPublished,
} from "@/lib/data/characters";
import {
  getRecordById,
  saveRecord,
  setRecordFeatured,
  setRecordPremium,
  setRecordPublished,
} from "@/lib/data/records";
import { updateUserRole } from "@/lib/data/users";
import type { ArchivumRecord, RecordInput, SeasonCharacterInput, UserRole } from "@/types";

function revalidateCharacterPaths(season: number) {
  revalidatePath("/admin");
  revalidatePath(`/temporada/${season}/personajes`);
}

function revalidateRecordPaths(
  record: ArchivumRecord,
  options?: { previousId?: string; previousTags?: string[] },
) {
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/admin");
  revalidatePath("/admin/relatos");
  revalidatePath(`/record/${record.id}`);
  revalidatePath(`/record/${record.id}/leer`);
  revalidatePath(`/record/${record.slug}`);
  revalidatePath(`/record/${record.slug}/leer`);
  revalidatePath(`/temporada/${record.season}/personajes`);

  const tags = new Set([...record.tags, ...(options?.previousTags ?? [])]);
  for (const tag of tags) {
    revalidatePath(`/etiqueta/${tag}`);
  }

  if (options?.previousId && options.previousId !== record.id) {
    revalidatePath(`/record/${options.previousId}`);
    revalidatePath(`/record/${options.previousId}/leer`);
  }
}

export async function createRecordAction(input: RecordInput) {
  const profile = await requireStaffProfile();
  validateRecordInput(input);
  const record = await saveRecord(input, { createdBy: profile.id });
  revalidateRecordPaths(record);
  return record;
}

export async function updateRecordAction(id: string, input: RecordInput) {
  await requireStaffProfile();
  validateRecordInput(input);
  const existing = await getRecordById(id, { includeUnpublished: true });
  const record = await saveRecord({ ...input, id });
  revalidateRecordPaths(record, { previousId: id, previousTags: existing?.tags });
  return record;
}

export async function togglePublishAction(id: string, published: boolean) {
  await requireStaffProfile();
  const record = await setRecordPublished(id, published);
  revalidateRecordPaths(record, { previousId: id });
  return record;
}

export async function toggleFeaturedAction(id: string, featured: boolean) {
  await requireStaffProfile();
  const record = await setRecordFeatured(id, featured);
  revalidateRecordPaths(record, { previousId: id });
  return record;
}

export async function togglePremiumAction(id: string, is_premium: boolean) {
  await requireStaffProfile();
  const record = await setRecordPremium(id, is_premium);
  revalidateRecordPaths(record, { previousId: id });
  return record;
}

export async function updateUserRoleAction(userId: string, role: UserRole) {
  const profile = await requireSuperuserProfile();
  if (profile.id === userId && role !== "superuser") {
    throw new Error("No puedes quitarte el rol de superusuario.");
  }

  const user = await updateUserRole(userId, role);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return user;
}

function validateCharacterInput(input: SeasonCharacterInput) {
  if (!input.name.trim()) {
    throw new Error("El nombre del personaje es obligatorio.");
  }

  if (!Number.isFinite(input.season) || input.season < 1) {
    throw new Error("La temporada debe ser mayor que cero.");
  }

  if (input.image_url && !/^https?:\/\//.test(input.image_url.trim())) {
    throw new Error("El retrato debe ser una URL válida.");
  }
}

export async function copyProtagonistsAction(
  sourceStorySlug: string,
  targetStorySlug: string,
  season: number,
  sourceCharacterIds?: string[],
) {
  await requireStaffProfile();
  const result = await copyProtagonistsToNovel(
    sourceStorySlug,
    targetStorySlug,
    season,
    sourceCharacterIds,
  );
  revalidatePath("/admin");
  revalidatePath(`/temporada/${season}/personajes`);
  return result;
}

export async function createCharacterAction(input: SeasonCharacterInput) {
  await requireStaffProfile();
  validateCharacterInput(input);
  const character = await saveCharacter(input);
  revalidateCharacterPaths(character.season);
  return character;
}

export async function updateCharacterAction(id: string, input: SeasonCharacterInput) {
  await requireStaffProfile();
  validateCharacterInput(input);
  const character = await saveCharacter({ ...input, id });
  revalidateCharacterPaths(character.season);
  return character;
}

export async function deleteCharacterAction(id: string, season: number) {
  await requireStaffProfile();
  await deleteCharacter(id);
  revalidateCharacterPaths(season);
}

export async function toggleCharacterPublishAction(id: string, season: number, published: boolean) {
  await requireStaffProfile();
  const character = await setCharacterPublished(id, published);
  revalidateCharacterPaths(season);
  return character;
}
