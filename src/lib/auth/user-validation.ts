import type { UserGender, UserLoginInput, UserRegistrationInput } from "@/types/user";

export function normalizeMobile(raw: string): string {
  return raw.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function validateRegistrationInput(input: UserRegistrationInput): string | null {
  if (!input.privacyAccepted) {
    return "Debes aceptar el aviso de privacidad para crear tu cuenta.";
  }
  if (!input.firstName.trim() || input.firstName.trim().length < 2) {
    return "Indica tu nombre (mínimo 2 caracteres).";
  }
  if (!input.lastName.trim() || input.lastName.trim().length < 2) {
    return "Indica tu apellido (mínimo 2 caracteres).";
  }
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Correo electrónico no válido.";
  }
  const mobile = normalizeMobile(input.mobile);
  if (mobile.replace(/\D/g, "").length < 8) {
    return "Número móvil no válido.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    return "Fecha de nacimiento no válida.";
  }
  if (!input.country.trim()) {
    return "Selecciona tu país.";
  }
  if (input.gender !== "hombre" && input.gender !== "mujer") {
    return "Selecciona hombre o mujer.";
  }
  if (!isValidPin(input.pin)) {
    return "El código de acceso debe tener exactamente 4 dígitos.";
  }
  return null;
}

export function validateLoginInput(input: UserLoginInput): string | null {
  if (!isValidPin(input.pin)) {
    return "Introduce tu código de 4 dígitos.";
  }
  return null;
}

export function parseGender(value: string): UserGender | null {
  if (value === "hombre" || value === "mujer") return value;
  return null;
}
