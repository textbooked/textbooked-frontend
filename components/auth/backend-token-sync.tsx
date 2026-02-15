"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { syncBackendUser } from "@/lib/api/auth";
import { setBackendToken } from "@/lib/auth/backend-token";

export function BackendTokenSync() {
  const { data: session } = useSession();
  const syncedTokenRef = useRef<string | null>(null);
  const syncingTokenRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const token = session?.backendToken ?? null;
    setBackendToken(token);

    if (typeof window !== "undefined") {
      (
        window as Window & { __TEXTBOOKED_BACKEND_TOKEN__?: string | null }
      ).__TEXTBOOKED_BACKEND_TOKEN__ = token;
    }
  }, [session?.backendToken]);

  useEffect(() => {
    const token = session?.backendToken ?? null;

    if (!token) {
      syncedTokenRef.current = null;
      syncingTokenRef.current = null;
      return;
    }

    if (syncedTokenRef.current === token || syncingTokenRef.current === token) {
      return;
    }

    syncingTokenRef.current = token;

    let canceled = false;

    void (async () => {
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          await syncBackendUser(token);
          if (!canceled) {
            syncedTokenRef.current = token;
          }
          return;
        } catch (error: unknown) {
          if (attempt === maxAttempts) {
            console.error("Failed to sync authenticated user with backend.", error);
            return;
          }

          await sleep(attempt * 500);
        }
      }
    })().finally(() => {
      if (!canceled && syncingTokenRef.current === token) {
        syncingTokenRef.current = null;
      }
    });

    return () => {
      canceled = true;
    };
  }, [session?.backendToken]);

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
