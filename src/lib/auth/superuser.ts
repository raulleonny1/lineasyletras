export function readSuperuserEmail() {
  return process.env.SUPERUSER_EMAIL?.trim().toLowerCase() ?? "raul.leon@admin.com";
}

export function isConfiguredSuperuserEmail(email?: string | null) {
  if (!email) return false;
  return email.trim().toLowerCase() === readSuperuserEmail();
}
