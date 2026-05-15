type AuthResponse = {
  ok: boolean;
  error?: string;
};

export async function postAuth(path: string, payload: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Respuesta inesperada del servidor. Reinicia npm run dev e inténtalo de nuevo.");
  }

  const data = (await response.json()) as AuthResponse;
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "No se pudo completar la solicitud.");
  }

  return data;
}
