"use client";

import Link from "next/link";
import { Compass, LibraryBig, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ONBOARDING_SKIP_STORAGE_KEY } from "@/app/(onboarding)/onboarding/types";
import { getTextbookedBackendAPI } from "@/lib/api/endpoints/core-client-axios";
import type { OnboardingStatusDto } from "@/lib/api/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const HomePage = () => {
  const apiRef = useRef(getTextbookedBackendAPI());
  const [status, setStatus] = useState<OnboardingStatusDto | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);

  useEffect(() => {
    setHasSkippedOnboarding(localStorage.getItem(ONBOARDING_SKIP_STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        setIsLoadingStatus(true);
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            const response = await apiRef.current.onboardingGetStatus();
            if (!canceled) {
              setStatus(response);
              setStatusError(null);
            }
            return;
          } catch {
            if (attempt === maxAttempts) {
              throw new Error("status-load-failed");
            }

            await wait(350 * attempt);
          }
        }
      } catch {
        if (!canceled) {
          setStatus(null);
          setStatusError("Could not load onboarding status.");
        }
      } finally {
        if (!canceled) {
          setIsLoadingStatus(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const shouldShowStartCta = status ? status.canStartOnboarding : true;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-sm text-muted-foreground">
          Start onboarding to generate your first study plan, or open your library workspace.
        </p>
      </div>

      <Card className="border-border/80 bg-gradient-to-br from-background to-muted/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Create your first study plan
          </CardTitle>
          <CardDescription>
            Choose guided learning or follow one specific source, then Textbooked creates your initial sections and activities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusError ? (
            <p className="text-sm text-muted-foreground">{statusError}</p>
          ) : null}

          {isLoadingStatus ? (
            <p className="text-sm text-muted-foreground">Checking onboarding status...</p>
          ) : null}

          {shouldShowStartCta ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/onboarding">
                  <Compass className="size-4" />
                  Create your first study plan
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/library">
                  <LibraryBig className="size-4" />
                  Open Library
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Onboarding is complete for this account.</p>
              <p className="text-sm text-muted-foreground">
                Continue from your existing plan or browse your library workspace.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/library">
                    <LibraryBig className="size-4" />
                    Open Library
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/settings">Open Settings</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/help">Open Support Center</Link>
                </Button>
              </div>
            </div>
          )}

          {hasSkippedOnboarding && shouldShowStartCta ? (
            <p className="text-xs text-muted-foreground">
              You skipped onboarding earlier. You can restart it anytime.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
