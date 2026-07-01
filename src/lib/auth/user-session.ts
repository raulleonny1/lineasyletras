import { createHmac, timingSafeEqual } from "crypto";

export const USER_COOKIE_NAME = "lyl_user_session";
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return process.env.USER_SESSION_SECRET || process.env.ADMIN_SECRET || "dev-user-secret-change-me";
}

export function createUserSessionToken(userId: string): string {
  const expires = Date.now() + USER_SESSION_MAX_AGE * 1000;
  const payload = `user:${userId}:${expires}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function parseUserSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [role, userId, expiresStr, sig] = decoded.split(":");
    if (role !== "user" || !userId || !expiresStr || !sig) return null;
    if (Date.now() > Number(expiresStr)) return null;
    const payload = `${role}:${userId}:${expiresStr}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}
