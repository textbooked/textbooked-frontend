import type { ReactNode } from "react";

import type { ThemeMode } from "@/lib/theme/types";

export type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

export type ThemeProviderProps = {
  children: ReactNode;
};
