import { ApiError, extractErrorMessage } from "@/lib/api/request";

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
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
    throw new ApiError(
      extractErrorMessage(data, response.status),
      response.status,
      data,
    );
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
}

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL.");
  }

  return backendUrl.replace(/\/$/, "");
}

async function resolveBackendToken(): Promise<string | null> {
  const cachedToken = readWindowToken();
  if (cachedToken) {
    return cachedToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getSession } = await import("next-auth/react");
    const session = (await getSession()) as { backendToken?: string } | null;
    const token = session?.backendToken ?? null;
    writeWindowToken(token);
    return token;
  } catch {
    return null;
  }
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

function writeWindowToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  (window as Window & { __TEXTBOOKED_BACKEND_TOKEN__?: string | null }).__TEXTBOOKED_BACKEND_TOKEN__ =
    token;
}
