let backendToken: string | null = null;

export function setBackendToken(token: string | null): void {
  backendToken = token;
}

export function getBackendToken(): string | null {
  return backendToken;
}
