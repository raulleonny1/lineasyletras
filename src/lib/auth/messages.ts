export function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos. Si acabas de registrarte, confirma el correo antes de entrar.";
  }

  if (normalized.includes("email not confirmed")) {
    return "La cuenta aún no está activa. En local puedes activarla sin correo real.";
  }

  if (normalized.includes("user already registered")) {
    return "Ese correo ya tiene cuenta. Inicia sesión o recupera la contraseña.";
  }

  if (normalized.includes("password should be at least")) {
    return "La contraseña no cumple la longitud mínima exigida por Supabase.";
  }

  return message;
}
