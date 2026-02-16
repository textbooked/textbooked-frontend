export const THEME_STORAGE_KEY = "textbooked-theme";

export type ThemeMode = "light" | "dark";

export function normalizeTheme(value: unknown): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return normalizeTheme(storedTheme);
  } catch {
    return "light";
  }
}

export function writeStoredTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // noop
  }
}

export function buildThemeInitScript(): string {
  return `(() => {
  try {
    const key = ${JSON.stringify(THEME_STORAGE_KEY)};
    const stored = window.localStorage.getItem(key);
    const theme = stored === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {
    // noop
  }
})();`;
}
