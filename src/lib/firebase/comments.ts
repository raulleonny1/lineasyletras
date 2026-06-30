import { FieldValue } from "firebase-admin/firestore";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import type { StoryComment } from "@/types/comment";
import { getAdminFirestore } from "./admin";
import { getFirestoreDb } from "./config";

const COMMENTS = "comments";
const ENGAGEMENT = "story_engagement";

function mapComment(id: string, data: Record<string, unknown>): StoryComment {
  const created = data.createdAt;
  let createdAt = new Date().toISOString();
  if (created && typeof created === "object" && "toDate" in created) {
    createdAt = (created as { toDate: () => Date }).toDate().toISOString();
  } else if (typeof created === "string") {
    createdAt = created;
  }

  return {
    id,
    storyId: data.storyId as string,
    authorName: data.authorName as string,
    text: data.text as string,
    createdAt,
  };
}

export async function fetchComments(storyId: string): Promise<StoryComment[]> {
  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection(COMMENTS)
        .where("storyId", "==", storyId)
        .orderBy("createdAt", "desc")
        .get();
      return snap.docs.map((d) => mapComment(d.id, d.data()));
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
      return [];
    }
  }

  const db = getFirestoreDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, COMMENTS),
      where("storyId", "==", storyId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapComment(d.id, d.data()));
  } catch (error) {
    console.error("Error al cargar comentarios:", error);
    return [];
  }
}

export async function addComment(
  storyId: string,
  authorName: string,
  text: string
): Promise<StoryComment | null> {
  const payload = {
    storyId,
    authorName,
    text,
    createdAt: FieldValue.serverTimestamp(),
  };

  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const ref = await adminDb.collection(COMMENTS).add(payload);
      return {
        id: ref.id,
        storyId,
        authorName,
        text,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error al guardar comentario:", error);
      return null;
    }
  }

  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const ref = await addDoc(collection(db, COMMENTS), {
      storyId,
      authorName,
      text,
      createdAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      storyId,
      authorName,
      text,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error al guardar comentario:", error);
    return null;
  }
}

export async function getLikeCount(storyId: string): Promise<number> {
  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const snap = await adminDb.doc(`${ENGAGEMENT}/${storyId}`).get();
      return (snap.data()?.likeCount as number) || 0;
    } catch {
      return 0;
    }
  }

  const db = getFirestoreDb();
  if (!db) return 0;

  try {
    const snap = await getDoc(doc(db, ENGAGEMENT, storyId));
    return (snap.data()?.likeCount as number) || 0;
  } catch {
    return 0;
  }
}

export async function adjustLikeCount(storyId: string, delta: number): Promise<number> {
  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const ref = adminDb.doc(`${ENGAGEMENT}/${storyId}`);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({ likeCount: Math.max(0, delta), updatedAt: FieldValue.serverTimestamp() });
        return Math.max(0, delta);
      }
      await ref.update({
        likeCount: FieldValue.increment(delta),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const updated = await ref.get();
      return Math.max(0, (updated.data()?.likeCount as number) || 0);
    } catch (error) {
      console.error("Error al actualizar likes:", error);
      return 0;
    }
  }

  const db = getFirestoreDb();
  if (!db) return 0;

  try {
    const ref = doc(db, ENGAGEMENT, storyId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { likeCount: Math.max(0, delta) });
      return Math.max(0, delta);
    }
    await updateDoc(ref, { likeCount: increment(delta) });
    const updated = await getDoc(ref);
    return Math.max(0, (updated.data()?.likeCount as number) || 0);
  } catch (error) {
    console.error("Error al actualizar likes:", error);
    return 0;
  }
}
