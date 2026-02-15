const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parseRequiredUuid(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return isUuid(trimmed) ? trimmed : null;
}

export function parseOptionalUuid(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return parseRequiredUuid(value);
}
