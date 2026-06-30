import { getStorage } from "firebase-admin/storage";
import { getApps } from "firebase-admin/app";
import { getAdminFirestore } from "./admin";
import { buildFirebaseStoragePublicUrl, coverApiUrl } from "./storage-url";

function getBucketName(): string | null {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || null;
}

export function isStorageConfigured(): boolean {
  return Boolean(getBucketName() && getAdminFirestore());
}

export async function uploadCoverToStorage(
  storyId: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const bucketName = getBucketName();
  if (!bucketName) return null;

  getAdminFirestore();
  const apps = getApps();
  if (!apps.length) return null;

  try {
    const bucket = getStorage(apps[0]).bucket(bucketName);
    const path = `covers/${storyId}.jpg`;
    const file = bucket.file(path);

    await file.save(buffer, {
      metadata: { contentType, cacheControl: "public, max-age=31536000" },
    });

    try {
      await file.makePublic();
    } catch {
      /* ignore */
    }

    return buildFirebaseStoragePublicUrl(bucketName, path);
  } catch (error) {
    console.error("Error al subir portada a Storage:", error);
    return null;
  }
}

/** Guarda la imagen en Firestore y devuelve URL estable vía /api/covers (funciona en Vercel). */
export async function saveCoverFallback(
  storyId: string,
  buffer: Buffer
): Promise<string> {
  const adminDb = getAdminFirestore();
  const coverImageUrl = coverApiUrl(storyId);

  if (adminDb) {
    await adminDb.collection("stories").doc(storyId).update({
      coverImageUrl,
      coverImageData: buffer.toString("base64"),
      updatedAt: new Date(),
    });
  }

  return coverImageUrl;
}

export async function getCoverImageBuffer(storyId: string): Promise<Buffer | null> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return null;

  try {
    const snap = await adminDb.collection("stories").doc(storyId).get();
    const data = snap.data();
    if (!data?.coverImageData) return null;
    return Buffer.from(data.coverImageData as string, "base64");
  } catch {
    return null;
  }
}

export async function removeCoverImage(storyId: string): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return;

  await adminDb.collection("stories").doc(storyId).update({
    coverImageUrl: null,
    coverImageData: null,
    updatedAt: new Date(),
  });

  const bucketName = getBucketName();
  if (bucketName) {
    getAdminFirestore();
    const apps = getApps();
    if (apps.length) {
      try {
        const bucket = getStorage(apps[0]).bucket(bucketName);
        await bucket.file(`covers/${storyId}.jpg`).delete({ ignoreNotFound: true });
      } catch {
        /* ignore */
      }
    }
  }
}

/** Guarda portada: siempre URL fiable + copia en Firestore; Storage opcional. */
export async function saveStoryCover(
  storyId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const coverImageUrl = await saveCoverFallback(storyId, buffer);
  await uploadCoverToStorage(storyId, buffer, contentType);
  return coverImageUrl;
}
