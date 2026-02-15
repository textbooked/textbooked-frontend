export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function extractErrorMessage(error: unknown, status: number): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;

    const message = errorRecord.message;
    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.map((value) => String(value)).join(", ");
    }

    const fallback = errorRecord.error;
    if (typeof fallback === "string") {
      return fallback;
    }
  }

  if (status >= 500) {
    return "Server error. Please try again.";
  }

  if (status === 404) {
    return "Resource not found.";
  }

  return "Request failed.";
}

export function isApiError(error: unknown): error is ApiError {
  if (error instanceof ApiError) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { status?: unknown };
  return typeof maybeError.status === "number";
}
