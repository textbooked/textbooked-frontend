export type ApiConfig = {
  backendUrl: string;
  openApiPath: string;
  openApiUrl: string;
};

export function getApiConfig(): ApiConfig {
  const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!rawBackendUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL.");
  }

  const backendUrl = normalizeBackendUrl(
    rawBackendUrl,
  );
  const openApiPath = normalizeOpenApiPath(
    process.env.NEXT_PUBLIC_OPENAPI_PATH ?? "/swagger-json",
  );

  return {
    backendUrl,
    openApiPath,
    openApiUrl: new URL(openApiPath, backendUrl).toString(),
  };
}

function normalizeBackendUrl(rawValue: string): string {
  try {
    const parsed = new URL(rawValue);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_BACKEND_URL: ${rawValue}`);
  }
}

function normalizeOpenApiPath(rawValue: string): string {
  if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
    const parsed = new URL(rawValue);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  return rawValue.startsWith("/") ? rawValue : `/${rawValue}`;
}
