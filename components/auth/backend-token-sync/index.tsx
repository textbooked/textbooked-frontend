"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { appendAccessToken, removeHeader } from "@/lib/api/axios";
import { getTextbookedBackendAPI } from "@/lib/api/endpoints/core-client-axios";

export function BackendTokenSync() {
  const { data: session } = useSession();
  const apiRef = useRef(getTextbookedBackendAPI());
  const syncedTokenRef = useRef<string | null>(null);
  const syncingTokenRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const token = session?.apiToken ?? null;
    if (token) {
      appendAccessToken(token);
      return;
    }

    removeHeader("Authorization");
  }, [session?.apiToken]);

  useEffect(() => {
    const token = session?.apiToken ?? null;

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
          await apiRef.current.authGetMe({
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

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
  }, [session?.apiToken]);

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
