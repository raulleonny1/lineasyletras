type PostgrestLikeError = {
  code?: string;
  message?: string;
};

function readPostgrestMessage(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as PostgrestLikeError;
    return typeof parsed.message === "string" && parsed.message.trim() ? parsed.message : null;
  } catch {
    return null;
  }
}

export function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  if (!error) {
    return fallback;
  }

  if (error instanceof Error) {
    const parsed = readPostgrestMessage(error.message);
    if (parsed) {
      return parsed;
    }

    if (error.message.trim()) {
      return error.message;
    }
  }

  if (typeof error === "object" && error !== null) {
    const record = error as PostgrestLikeError;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
  }

  return fallback;
}

export function assertNoSupabaseError(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
): asserts error is null | undefined {
  if (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export function isMissingCreatedByColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as PostgrestLikeError;
  return record.code === "PGRST204" && getErrorMessage(error).includes("created_by");
}
