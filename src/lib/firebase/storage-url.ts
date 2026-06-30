import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

/** URL pública correcta para archivos en Firebase Storage. */
export function buildFirebaseStoragePublicUrl(bucketName: string, filePath: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
}

/** Corrige URLs viejas o rotas de portadas. */
export function normalizeCoverImageUrl(
  storyId: string,
  url: string | undefined,
  hasEmbeddedData?: boolean
): string | undefined {
  if (hasEmbeddedData) {
    return absoluteUrl(`/api/covers/${storyId}`);
  }
  if (!url) return undefined;

  if (url.includes("storage.googleapis.com") && url.includes("firebasestorage.app")) {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
    const pathMatch = url.match(/firebasestorage\.app\/(.+)$/);
    if (bucket && pathMatch?.[1]) {
      return buildFirebaseStoragePublicUrl(bucket, pathMatch[1]);
    }
  }

  if (url.startsWith("/")) {
    return absoluteUrl(url);
  }

  return url;
}

export function coverApiUrl(storyId: string): string {
  return absoluteUrl(`/api/covers/${storyId}`);
}

export { getSiteUrl };
