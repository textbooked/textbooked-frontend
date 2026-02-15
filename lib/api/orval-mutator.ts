export const orvalFetcher = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const backendUrl = getBackendUrl();

  const requestUrl =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `${backendUrl}${url}`;

  const headers = new Headers(options.headers);
  const token = await resolveBackendToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  const rawBody = await response.text();
  let data: unknown = {};
  if (rawBody.length > 0) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = rawBody;
    }
  }

  if (!response.ok) {
    const error = new Error(extractErrorMessage(data, response.status)) as Error & {
      status?: number;
      details?: unknown;
    };

    error.status = response.status;
    error.details = data;
    throw error;
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};

async function resolveBackendToken(): Promise<string | null> {
  return readWindowToken();
}

function readWindowToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = (
    window as Window & { __TEXTBOOKED_BACKEND_TOKEN__?: string | null }
  ).__TEXTBOOKED_BACKEND_TOKEN__;

  return typeof token === "string" && token.length > 0 ? token : null;
}

function extractErrorMessage(error: unknown, status: number): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;

    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }

    if (Array.isArray(errorRecord.message)) {
      return errorRecord.message.map((value) => String(value)).join(", ");
    }

    if (typeof errorRecord.error === "string") {
      return errorRecord.error;
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

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL.");
  }

  return backendUrl.replace(/\/$/, "");
}
