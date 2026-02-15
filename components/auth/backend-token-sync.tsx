"use client";

import { useLayoutEffect } from "react";
import { useSession } from "next-auth/react";

import { setBackendToken } from "@/lib/auth/backend-token";

export function BackendTokenSync() {
  const { data: session } = useSession();

  useLayoutEffect(() => {
    const token = session?.backendToken ?? null;
    setBackendToken(token);

    if (typeof window !== "undefined") {
      (
        window as Window & { __TEXTBOOKED_BACKEND_TOKEN__?: string | null }
      ).__TEXTBOOKED_BACKEND_TOKEN__ = token;
    }
  }, [session?.backendToken]);

  return null;
}
