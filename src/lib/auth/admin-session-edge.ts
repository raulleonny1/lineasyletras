const COOKIE_NAME = "lyl_admin_session";

function getSecret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "dev-secret-change-me";
}

function decodeBase64Url(token: string): string {
  const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySessionTokenEdge(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded = decodeBase64Url(token);
    const [role, expiresStr, sig] = decoded.split(":");
    if (role !== "admin" || !expiresStr || !sig) return false;
    if (Date.now() > Number(expiresStr)) return false;
    const payload = `${role}:${expiresStr}`;
    const expected = await hmacHex(getSecret(), payload);
    return sig === expected;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
