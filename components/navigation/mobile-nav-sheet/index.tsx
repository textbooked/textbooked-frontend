"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookPlus,
  Compass,
  Home,
  LibraryBig,
  Network,
  Sparkles,
} from "lucide-react";
import type { ComponentType } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MobileNavSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type NavLinkItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavLinkItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/library",
    label: "Library",
    icon: LibraryBig,
    match: (pathname) => pathname.startsWith("/library"),
  },
  {
    href: "/knowledge-graph",
    label: "Knowledge Graph",
    icon: Network,
    match: (pathname) => pathname.startsWith("/knowledge-graph"),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: (pathname) => pathname.startsWith("/explore"),
  },
];

const SHORTCUT_ITEMS: NavLinkItem[] = [
  {
    href: "/onboarding",
    label: "Create Study Plan",
    icon: Sparkles,
    match: (pathname) => pathname.startsWith("/onboarding"),
  },
  {
    href: "/books/new",
    label: "Add Book",
    icon: BookPlus,
    match: (pathname) => pathname.startsWith("/books/new"),
  },
];

export function MobileNavSheet({
  open,
  onOpenChange,
}: MobileNavSheetProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/70 px-5 py-5 pr-14">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navigate Textbooked and jump into common study flows.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
            <section className="space-y-2">
              <p className="px-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Navigate
              </p>
              <div className="space-y-1.5">
                {NAV_ITEMS.map((item) => (
                  <SheetNavRow
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={item.match(pathname)}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="px-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Shortcuts
              </p>
              <div className="space-y-1.5">
                {SHORTCUT_ITEMS.map((item) => (
                  <SheetNavRow
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={item.match(pathname)}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type SheetNavRowProps = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
};

function SheetNavRow({
  href,
  icon: Icon,
  label,
  active,
  onNavigate,
}: SheetNavRowProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors",
        active
          ? "border-border bg-accent/70 text-foreground shadow-xs"
          : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-accent/40 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
          active
            ? "border-border/80 bg-background/70"
            : "border-border/40 bg-muted/50",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="truncate font-medium">{label}</span>
    </Link>
  );
}
