import { getSiteUrl } from "@/lib/site-url";

export function getStoryShareUrl(storyId: string): string {
  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin
      : getSiteUrl();
  return `${base}/historia/${storyId}`;
}

export function buildShareMessage(title: string, summary: string): string {
  return `"${title}" — Líneas y Letras. ${summary}`;
}

export function buildFullShareText(storyId: string, title: string, summary: string): string {
  return `${buildShareMessage(title, summary)}\n\n${getStoryShareUrl(storyId)}`;
}

export function isLocalDevUrl(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function getFacebookShareUrl(storyId: string): string {
  const url = encodeURIComponent(getStoryShareUrl(storyId));
  return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

export function getWhatsAppShareUrl(storyId: string, title: string, summary: string): string {
  const text = encodeURIComponent(buildFullShareText(storyId, title, summary));
  return `https://wa.me/?text=${text}`;
}

async function copyShareText(storyId: string, title: string, summary: string): Promise<void> {
  const text = buildFullShareText(storyId, title, summary);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

/** Compartir en el muro personal del lector (no en la página de Líneas y Letras). */
export async function shareToFacebookPersonal(
  storyId: string,
  title: string,
  summary: string
): Promise<"native" | "popup" | "cancelled"> {
  const url = getStoryShareUrl(storyId);

  await copyShareText(storyId, title, summary);

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${title} — Líneas y Letras`,
        text: buildShareMessage(title, summary),
        url,
      });
      return "native";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancelled";
    }
  }

  const shareUrl = getFacebookShareUrl(storyId);
  const popup = window.open(shareUrl, "compartir-facebook", "width=600,height=520,scrollbars=yes");

  if (!popup) {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  return "popup";
}

export async function shareToInstagramPersonal(
  storyId: string,
  title: string,
  summary: string
): Promise<"native" | "clipboard" | "cancelled"> {
  await copyShareText(storyId, title, summary);

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${title} — Líneas y Letras`,
        text: buildShareMessage(title, summary),
        url: getStoryShareUrl(storyId),
      });
      return "native";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancelled";
    }
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  return "clipboard";
}

/** Alias para compatibilidad */
export const shareToInstagram = shareToInstagramPersonal;

export async function nativeShare(storyId: string, title: string, summary: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title: `${title} — Líneas y Letras`,
      text: summary,
      url: getStoryShareUrl(storyId),
    });
    return true;
  } catch {
    return false;
  }
}
