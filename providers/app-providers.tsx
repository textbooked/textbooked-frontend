"use client";

import { BackendTokenSync } from "@/components/auth/backend-token-sync";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

import type { ReactNode } from "react";

const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <SessionProvider>
        <BackendTokenSync />
        {children}
      </SessionProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
};

export default AppProviders;
