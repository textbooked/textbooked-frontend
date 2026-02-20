import Link from "next/link";

import { AvatarMenu } from "@/components/navigation/avatar-menu";

import { AuthGuard } from "./components/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-semibold tracking-tight">
                Textbooked.org
              </Link>
              <nav className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
                <Link href="/" className="transition-colors hover:text-foreground">
                  Home
                </Link>
                <Link href="/library" className="transition-colors hover:text-foreground">
                  Library
                </Link>
              </nav>
            </div>
            <AvatarMenu />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
