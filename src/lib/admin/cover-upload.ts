export type CoverUploadExtras = {
  coverBlob?: Blob | null;
  removeCover?: boolean;
};

export type PublishResult = {
  id: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  published: boolean;
};

export async function uploadStoryCover(storyId: string, blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("storyId", storyId);
  form.append("file", blob, "cover.jpg");

  const res = await fetch("/api/admin/cover-image", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al subir la imagen");
  return data.coverImageUrl as string;
}

export async function removeStoryCover(storyId: string): Promise<void> {
  const res = await fetch(`/api/admin/cover-image?storyId=${encodeURIComponent(storyId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al quitar la imagen");
  }
}

export async function finalizeStorySave(
  storyId: string,
  data: { title: string; summary: string; published?: boolean; coverImageUrl?: string },
  extras?: CoverUploadExtras
): Promise<PublishResult> {
  let coverImageUrl = data.coverImageUrl;

  if (extras?.removeCover) {
    await removeStoryCover(storyId);
    coverImageUrl = undefined;
  } else if (extras?.coverBlob) {
    coverImageUrl = await uploadStoryCover(storyId, extras.coverBlob);
  }

  return {
    id: storyId,
    title: data.title,
    summary: data.summary,
    coverImageUrl,
    published: Boolean(data.published),
  };
}
