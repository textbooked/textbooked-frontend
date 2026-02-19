import { getBackendToken } from "@/lib/auth/backend-token";

type MutatorResponse<TData> = {
  data: TData;
  status: number;
  headers: Headers;
};

export async function orvalFetcher<TData>(
  url: string,
  options: RequestInit = {},
): Promise<TData> {
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

  const response = await fetch(
    requestUrl,
    Object.assign({}, options, { headers }),
  );

  const rawBody = await response.text();
  let data: unknown;

  if (rawBody.length > 0) {
    try {
      data = JSON.parse(rawBody);
    } catch (parseError) {
      void parseError;
      data = rawBody;
    }
  }

  if (!response.ok) {
    throw Object.assign(new Error(extractErrorMessage(data, response.status)), {
      status: response.status,
      details: data,
    });
  }

  const result: MutatorResponse<unknown> = {
    data: data as TData,
    status: response.status,
    headers: response.headers,
  };

  return result as TData;
}

async function resolveBackendToken() {
  try {
    const token = getBackendToken();
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch (tokenError) {
    void tokenError;
    return null;
  }
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
