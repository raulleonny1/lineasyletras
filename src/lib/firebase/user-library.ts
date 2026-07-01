import { FieldValue } from "firebase-admin/firestore";
import type { ReadingEntry } from "@/types/user-library";
import { getAdminFirestore } from "./admin";

const READING_SUB = "reading";

function readingRef(userId: string, storyId: string) {
  const adminDb = getAdminFirestore();
  if (!adminDb) return null;
  return adminDb.collection("users").doc(userId).collection(READING_SUB).doc(storyId);
}

export async function getUserReadingEntries(userId: string): Promise<ReadingEntry[]> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection(READING_SUB)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const readAt = data.readAt?.toDate?.() ?? data.readAt;
      const startedAt = data.startedAt?.toDate?.() ?? data.startedAt;
      return {
        storyId: doc.id,
        readAt: readAt instanceof Date ? readAt.toISOString() : String(readAt ?? ""),
        startedAt:
          startedAt instanceof Date
            ? startedAt.toISOString()
            : startedAt
              ? String(startedAt)
              : undefined,
      };
    });
  } catch (error) {
    console.error("Error al cargar lecturas del usuario:", error);
    return [];
  }
}

export async function markStoryRead(userId: string, storyId: string): Promise<ReadingEntry | null> {
  const ref = readingRef(userId, storyId);
  if (!ref) return null;

  const now = new Date();
  try {
    const existing = await ref.get();
    const payload: Record<string, unknown> = {
      readAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!existing.exists) {
      payload.startedAt = FieldValue.serverTimestamp();
      payload.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(payload, { merge: true });

    return {
      storyId,
      readAt: now.toISOString(),
      startedAt: existing.exists
        ? undefined
        : now.toISOString(),
    };
  } catch (error) {
    console.error("Error al marcar historia como leída:", error);
    return null;
  }
}
