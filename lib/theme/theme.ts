import {
  FAVICON_DARK_PATH,
  FAVICON_LIGHT_PATH,
  THEME_FAVICON_LINK_ID,
  THEME_STORAGE_KEY,
} from "@/lib/theme/consts";
import type { ThemeMode } from "@/lib/theme/types";

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

export function getThemeFaviconHref(theme: ThemeMode): string {
  const path = theme === "dark" ? FAVICON_DARK_PATH : FAVICON_LIGHT_PATH;
  return `${path}?theme=${theme}`;
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
  const faviconLight = JSON.stringify(getThemeFaviconHref("light"));
  const faviconDark = JSON.stringify(getThemeFaviconHref("dark"));
  const faviconLinkId = JSON.stringify(THEME_FAVICON_LINK_ID);

  return `(() => {
  try {
    const key = ${JSON.stringify(THEME_STORAGE_KEY)};
    const stored = window.localStorage.getItem(key);
    const theme = stored === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    const head = document.head;
    if (head) {
      const href = theme === "dark" ? ${faviconDark} : ${faviconLight};
      let link = document.getElementById(${faviconLinkId});
      if (!link) {
        const link = document.createElement("link");
        link.id = ${faviconLinkId};
        link.rel = "icon";
        link.type = "image/x-icon";
        link.href = href;
        head.appendChild(link);
      } else {
        link.type = "image/x-icon";
        link.href = href;
      }
    }
  } catch {
    // noop
  }
})();`;
}
