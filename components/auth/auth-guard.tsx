"use client";

import type { ReactNode } from "react";
import { LogIn } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();

  if (
    status === "loading" ||
    (status === "authenticated" && !session?.backendToken)
  ) {
    return <LoadingState label="Checking authentication..." />;
  }

  if (status !== "authenticated") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Please sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in with Google to test authenticated backend flows.
          </p>
          <Button type="button" onClick={() => void signIn("google")}>
            <LogIn className="size-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
