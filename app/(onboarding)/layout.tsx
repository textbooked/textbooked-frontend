import type { ReactNode } from "react";

import { AuthGuard } from "@/app/(app)/components/auth-guard";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-muted/30">{children}</main>
    </AuthGuard>
  );
}
