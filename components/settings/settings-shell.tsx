import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";

import { SettingsNav } from "@/components/settings/settings-nav";
import { Button } from "@/components/ui/button";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-background via-background to-muted/30 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-muted/40 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Settings2 className="size-3.5" />
              Preferences
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Configure account defaults and study preferences. Changes here are local for now and saved to this browser.
            </p>
          </div>

          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Library
            </Link>
          </Button>
        </div>
      </div>

      <SettingsNav mode="mobile" />

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <SettingsNav mode="desktop" />

        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
