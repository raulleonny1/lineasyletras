import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const PIN_ITERATIONS = 120_000;

function getPinLookupSecret(): string {
  return (
    process.env.PIN_LOOKUP_SECRET ||
    process.env.USER_SESSION_SECRET ||
    process.env.ADMIN_SECRET ||
    "dev-pin-lookup-secret"
  );
}

/** Clave de búsqueda para login solo con PIN (no reversible). */
export function pinLookupKey(pin: string): string {
  return createHmac("sha256", getPinLookupSecret()).update(pin).digest("hex");
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(pin, salt, PIN_ITERATIONS, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = pbkdf2Sync(pin, salt, PIN_ITERATIONS, 32, "sha256").toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
  } catch {
    return false;
  }
}
