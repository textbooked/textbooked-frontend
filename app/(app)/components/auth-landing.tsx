"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";

type AuthLandingProps = {
  onContinue: () => void;
};

export function AuthLanding({ onContinue }: AuthLandingProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-border/80 bg-gradient-to-b from-background to-muted/30 p-8 shadow-sm">
            <div className="space-y-5 text-center">
              <h1 className="text-4xl font-semibold tracking-tight">Textbooked</h1>
              <p className="text-sm text-muted-foreground">
                Turn dense textbooks into calm, measurable progress.
              </p>

              <Button type="button" className="w-full" onClick={onContinue}>
                <LogIn className="size-4" />
                Continue with Google
              </Button>
            </div>
          </div>
        </div>

        <footer className="border-t bg-background/70">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
            <p>&copy; {currentYear} Textbooked</p>

            <Link href="/help" className="hover:text-foreground hover:underline">
              Help
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
