import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "lyl_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "dev-secret-change-me";
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return password === "admin123";
  return password === expected;
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `admin:${expires}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [role, expiresStr, sig] = decoded.split(":");
    if (role !== "admin" || !expiresStr || !sig) return false;
    if (Date.now() > Number(expiresStr)) return false;
    const payload = `${role}:${expiresStr}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { COOKIE_NAME, SESSION_MAX_AGE };
