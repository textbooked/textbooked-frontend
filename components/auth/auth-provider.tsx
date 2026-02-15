"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import { BackendTokenSync } from "@/components/auth/backend-token-sync";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <BackendTokenSync />
      {children}
    </SessionProvider>
  );
}
