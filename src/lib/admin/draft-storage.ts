export const ADMIN_DRAFT_KEY = "lyl_admin_draft";

export type AdminDraft = {
  title?: string;
  content?: string;
  category?: string;
  summary?: string;
  tags?: string;
};

export function saveAdminDraft(draft: AdminDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(draft));
}

export function loadAdminDraft(): AdminDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ADMIN_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminDraft;
  } catch {
    return null;
  }
}

export function clearAdminDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_DRAFT_KEY);
}
