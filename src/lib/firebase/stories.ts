import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { Story, StoryInput } from "@/types/story";
import { buildStoryFromInput } from "@/lib/stories/utils";
import { getFirestoreDb } from "./config";
import { getAdminFirestore } from "./admin";

const COLLECTION = "stories";

function mapDataToStory(id: string, data: DocumentData): Story {
  return {
    id,
    title: data.title as string,
    author: (data.author as string) || "Líneas y Letras",
    category: data.category as string,
    summary: data.summary as string,
    content: data.content as string,
    tags: (data.tags as string[]) || [],
    readTime: data.readTime as string,
    date: data.date as string,
    color: data.color as string,
    coverImageUrl: data.coverImageUrl as string | undefined,
    published: data.published !== false,
    source: (data.source as Story["source"]) || "admin",
    isUserCreated: data.source === "user",
  };
}

function mapClientDoc(snap: QueryDocumentSnapshot<DocumentData>): Story {
  return mapDataToStory(snap.id, snap.data());
}

function mapAdminDoc(snap: { id: string; data: () => DocumentData | undefined }): Story {
  return mapDataToStory(snap.id, snap.data() ?? {});
}

export async function fetchPublishedStories(): Promise<Story[]> {
  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(COLLECTION)
        .where("published", "==", true)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map(mapAdminDoc);
    } catch (error) {
      console.error("Error al cargar historias publicadas (admin):", error);
      return [];
    }
  }

  const db = getFirestoreDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, COLLECTION),
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapClientDoc);
  } catch (error) {
    console.error("Error al cargar historias publicadas:", error);
    return [];
  }
}

export async function fetchAllStories(): Promise<Story[]> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map(mapAdminDoc);
  } catch (error) {
    console.error("Error al cargar todas las historias (admin):", error);
    return [];
  }
}

export async function fetchStoryById(id: string): Promise<Story | null> {
  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const snap = await adminDb.collection(COLLECTION).doc(id).get();
      if (!snap.exists) return null;
      return mapAdminDoc(snap);
    } catch (error) {
      console.error("Error al cargar historia (admin):", error);
      return null;
    }
  }

  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return mapClientDoc(snap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error al cargar historia:", error);
    return null;
  }
}

export async function createStory(input: StoryInput): Promise<Story | null> {
  const story = buildStoryFromInput(input);
  const payload = {
    title: story.title,
    author: story.author,
    category: story.category,
    summary: story.summary,
    content: story.content,
    tags: story.tags,
    readTime: story.readTime,
    date: story.date,
    color: story.color,
    coverImageUrl: story.coverImageUrl ?? null,
    published: story.published ?? false,
    source: story.source ?? "admin",
  };

  const adminDb = getAdminFirestore();
  if (!adminDb) return null;

  try {
    const docRef = await adminDb.collection(COLLECTION).add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...story, id: docRef.id };
  } catch (error) {
    console.error("Error al crear historia (admin):", error);
    return null;
  }
}

export async function updateStory(id: string, input: Partial<StoryInput>): Promise<boolean> {
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) payload.title = input.title;
  if (input.author !== undefined) payload.author = input.author;
  if (input.category !== undefined) payload.category = input.category;
  if (input.summary !== undefined) payload.summary = input.summary;
  if (input.content !== undefined) {
    payload.content = input.content;
    payload.readTime =
      input.readTime ??
      buildStoryFromInput({
        ...input,
        title: input.title ?? "",
        author: input.author ?? "",
        category: input.category ?? "",
        summary: input.summary ?? "",
        content: input.content,
        tags: input.tags ?? [],
        color: input.color ?? "",
      }).readTime;
  }
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.color !== undefined) payload.color = input.color;
  if (input.coverImageUrl !== undefined) payload.coverImageUrl = input.coverImageUrl;
  if (input.published !== undefined) payload.published = input.published;
  if (input.date !== undefined) payload.date = input.date;
  if (input.readTime !== undefined) payload.readTime = input.readTime;

  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  try {
    await adminDb
      .collection(COLLECTION)
      .doc(id)
      .update({ ...payload, updatedAt: FieldValue.serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Error al actualizar historia (admin):", error);
    return false;
  }
}

export async function deleteStory(id: string): Promise<boolean> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  try {
    await adminDb.collection(COLLECTION).doc(id).delete();
    return true;
  } catch (error) {
    console.error("Error al eliminar historia (admin):", error);
    return false;
  }
}

export async function seedStories(stories: Story[]): Promise<number> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return 0;

  let count = 0;
  for (const story of stories) {
    await adminDb.collection(COLLECTION).add({
      title: story.title,
      author: story.author,
      category: story.category,
      summary: story.summary,
      content: story.content,
      tags: story.tags,
      readTime: story.readTime,
      date: story.date,
      color: story.color,
      published: true,
      source: "curated",
      seedId: story.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;
  }
  return count;
}

/** @deprecated Use fetchPublishedStories */
export async function fetchUserStoriesFromFirebase(): Promise<Story[]> {
  return fetchPublishedStories();
}

/** @deprecated Use createStory */
export async function saveStoryToFirebase(story: Story): Promise<string | null> {
  const created = await createStory({
    title: story.title,
    author: story.author,
    category: story.category,
    summary: story.summary,
    content: story.content,
    tags: story.tags,
    color: story.color,
    published: story.published ?? true,
    source: "user",
  });
  return created?.id ?? null;
}
