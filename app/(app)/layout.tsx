import Link from "next/link";

import { AuthButton } from "@/components/auth/auth-button";

import { AuthGuard } from "./components/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Textbooked
            </Link>
            <AuthButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
