import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

/** URL pública correcta para archivos en Firebase Storage. */
export function buildFirebaseStoragePublicUrl(bucketName: string, filePath: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
}

const coverPath = (storyId: string) => `/api/covers/${storyId}`;

/** URL de portada para <img> en el cliente (misma origen). */
export function clientCoverImageSrc(
  storyId: string,
  url?: string | null,
  blobPreview?: string | null
): string | undefined {
  if (blobPreview?.startsWith("blob:")) return blobPreview;
  if (url?.startsWith("blob:")) return url;

  const apiPath = coverPath(storyId);

  if (!url) {
    return blobPreview && !blobPreview.startsWith("blob:") ? blobPreview : undefined;
  }

  if (url.includes("/api/covers/")) return apiPath;

  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/covers/")) return apiPath;
  } catch {
    /* not a URL */
  }

  return url;
}

/** Corrige URLs viejas o rotas de portadas. */
export function normalizeCoverImageUrl(
  storyId: string,
  url: string | undefined,
  hasEmbeddedData?: boolean
): string | undefined {
  if (hasEmbeddedData) {
    return coverPath(storyId);
  }
  if (!url) return undefined;

  if (url.includes("/api/covers/")) {
    return coverPath(storyId);
  }

  if (url.includes("storage.googleapis.com") && url.includes("firebasestorage.app")) {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
    const pathMatch = url.match(/firebasestorage\.app\/(.+)$/);
    if (bucket && pathMatch?.[1]) {
      return buildFirebaseStoragePublicUrl(bucket, pathMatch[1]);
    }
  }

  if (url.startsWith("/")) {
    return url;
  }

  return url;
}

export function coverApiUrl(storyId: string): string {
  return coverPath(storyId);
}

export function absoluteCoverImageUrl(storyId: string): string {
  return absoluteUrl(coverPath(storyId));
}

/** Imagen Open Graph para Facebook (siempre accesible para crawlers). */
export function storyOgImageUrl(storyId: string): string {
  return absoluteUrl(`/historia/${storyId}/opengraph-image`);
}

export { getSiteUrl };
