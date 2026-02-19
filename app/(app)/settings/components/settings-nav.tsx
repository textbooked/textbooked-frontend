"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CreditCard,
  Shield,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { SettingsSectionIcon } from "@/lib/settings/types";
import { listSettingsSectionMeta } from "@/lib/settings/config";
import { cn } from "@/lib/utils";

type SettingsNavProps = {
  mode: "desktop" | "mobile";
};

const SECTION_ICON_MAP: Record<SettingsSectionIcon, LucideIcon> = {
  user: UserRound,
  calendar: CalendarClock,
  "credit-card": CreditCard,
  bell: Bell,
  shield: Shield,
  sliders: SlidersHorizontal,
};

export function SettingsNav({ mode }: SettingsNavProps) {
  const pathname = usePathname();
  const sections = listSettingsSectionMeta();

  if (mode === "mobile") {
    return (
      <div className="lg:hidden">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <nav className="inline-flex min-w-full items-center gap-2">
            {sections.map((section) => {
              const isActive = pathname === section.href;
              const Icon = SECTION_ICON_MAP[section.icon];

              return (
                <Link
                  key={section.id}
                  href={section.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "border-border bg-background text-foreground shadow-sm"
                      : "border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <Card className="hidden h-fit border-border/80 lg:sticky lg:top-4 lg:block">
      <CardContent className="px-3 py-3">
        <nav className="space-y-1" aria-label="Settings sections">
          {sections.map((section) => {
            const isActive = pathname === section.href;
            const Icon = SECTION_ICON_MAP[section.icon];

            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors",
                  isActive
                    ? "bg-muted/70 text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 rounded-md border p-1.5",
                    isActive
                      ? "border-border bg-background text-foreground"
                      : "border-border/70 bg-background/70 text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>

                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">{section.label}</span>
                  <span className="block text-xs text-muted-foreground">{section.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
