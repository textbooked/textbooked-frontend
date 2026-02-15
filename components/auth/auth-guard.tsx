"use client";

import type { ReactNode } from "react";
import { signIn, useSession } from "next-auth/react";

import { AuthLanding } from "@/components/auth/auth-landing";
import { LoadingState } from "@/components/loading-state";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();

  if (
    status === "loading" ||
    (status === "authenticated" && !session?.backendToken)
  ) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
          <LoadingState label="Checking authentication..." />
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <AuthLanding onContinue={() => void signIn("google")} />;
  }

  return <>{children}</>;
}
