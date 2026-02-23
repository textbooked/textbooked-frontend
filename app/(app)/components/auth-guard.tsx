"use client";

import { signIn, useSession } from "next-auth/react";
import type { ReactNode } from "react";

import { LoadingState } from "@/components/loading-state";

import { AuthLanding } from "./auth-landing";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading" || (status === "authenticated" && !session?.apiToken);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
          <LoadingState label="Checking authentication..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthLanding onContinue={() => void signIn("google")} />;
  }

  return <>{children}</>;
}
