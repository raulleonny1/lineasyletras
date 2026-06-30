import { FieldValue } from "firebase-admin/firestore";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDocs,
} from "firebase/firestore";
import { getAdminFirestore } from "./admin";
import { getFirestoreDb } from "./config";
import { normalizeCategoryName } from "@/lib/categories";

const SETTINGS_DOC = "settings/categories";

async function readCustomNamesAdmin(): Promise<string[]> {
  const db = getAdminFirestore();
  if (!db) return [];
  try {
    const snap = await db.doc(SETTINGS_DOC).get();
    const names = snap.data()?.names;
    return Array.isArray(names) ? (names as string[]) : [];
  } catch {
    return [];
  }
}

async function readCustomNamesClient(): Promise<string[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  try {
    const snap = await getDoc(doc(db, "settings", "categories"));
    const names = snap.data()?.names;
    return Array.isArray(names) ? (names as string[]) : [];
  } catch {
    return [];
  }
}

export async function fetchCustomCategories(): Promise<string[]> {
  if (getAdminFirestore()) {
    return readCustomNamesAdmin();
  }
  return readCustomNamesClient();
}

export async function fetchCategoriesFromStories(): Promise<string[]> {
  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const snap = await adminDb.collection("stories").get();
      const set = new Set<string>();
      snap.docs.forEach((d) => {
        const cat = d.data().category as string | undefined;
        if (cat?.trim()) set.add(cat.trim());
      });
      return [...set];
    } catch {
      return [];
    }
  }

  const db = getFirestoreDb();
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, "stories"));
    const set = new Set<string>();
    snap.docs.forEach((d) => {
      const cat = d.data().category as string | undefined;
      if (cat?.trim()) set.add(cat.trim());
    });
    return [...set];
  } catch {
    return [];
  }
}

export async function addCustomCategory(name: string): Promise<boolean> {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return false;

  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      const ref = adminDb.doc(SETTINGS_DOC);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({ names: [normalized], updatedAt: FieldValue.serverTimestamp() });
      } else {
        await ref.update({
          names: FieldValue.arrayUnion(normalized),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return true;
    } catch (error) {
      console.error("Error al guardar categoría (admin):", error);
      return false;
    }
  }

  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const ref = doc(db, "settings", "categories");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { names: [normalized] });
    } else {
      await updateDoc(ref, { names: arrayUnion(normalized) });
    }
    return true;
  } catch (error) {
    console.error("Error al guardar categoría:", error);
    return false;
  }
}
