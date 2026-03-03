"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  applyThemeToDocument,
  getThemeFaviconHref,
  readStoredTheme,
  THEME_FAVICON_LINK_ID,
  type ThemeMode,
  writeStoredTheme,
} from "@/lib/theme";
import type {
  ThemeContextValue,
  ThemeProviderProps,
} from "@/components/theme/theme-provider/types";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    writeStoredTheme(theme);
  }, [theme]);

  useThemeFaviconSync(theme);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeFaviconSync(theme: ThemeMode) {
  useEffect(() => {
    const link = document.getElementById(THEME_FAVICON_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      return;
    }

    const href = getThemeFaviconHref(theme);
    if (link.getAttribute("href") === href) {
      return;
    }

    link.setAttribute("href", href);
  }, [theme]);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
