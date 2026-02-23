"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, LibraryBig, Menu, Network } from "lucide-react";
import type { ComponentType } from "react";
import { memo, useMemo, useState } from "react";

import { AvatarMenu } from "@/components/navigation/avatar-menu";
import { MobileNavSheet } from "@/components/navigation/mobile-nav-sheet";
import { cn } from "@/lib/utils";

type RouteTab = {
  kind: "route";
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

type ActionTab = {
  kind: "action";
  id: "menu";
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type BottomTab = RouteTab | ActionTab;

const MOBILE_DOCK_TABS: readonly BottomTab[] = [
  {
    kind: "route",
    href: "/",
    label: "Home",
    icon: Home,
    match: (currentPathname: string) => currentPathname === "/",
  },
  {
    kind: "route",
    href: "/library",
    label: "Library",
    icon: LibraryBig,
    match: (currentPathname: string) => currentPathname.startsWith("/library"),
  },
  {
    kind: "route",
    href: "/knowledge-graph",
    label: "Graph",
    icon: Network,
    match: (currentPathname: string) => currentPathname.startsWith("/knowledge-graph"),
  },
  {
    kind: "route",
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: (currentPathname: string) => currentPathname.startsWith("/explore"),
  },
  {
    kind: "action",
    id: "menu",
    label: "Menu",
    icon: Menu,
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeRouteIndex = useMemo(
    () =>
      MOBILE_DOCK_TABS.findIndex(
        (tab) => tab.kind === "route" && tab.match(pathname),
      ),
    [pathname],
  );

  const activeTabIndex = menuOpen ? MOBILE_DOCK_TABS.length - 1 : activeRouteIndex;
  const hasActiveTab = activeTabIndex >= 0;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <div className="pointer-events-auto min-w-0 flex-1">
            <nav
              aria-label="Primary navigation"
              className="relative grid h-[4.25rem] grid-cols-5 rounded-[1.35rem] border border-border/60 bg-background/70 p-1.5 shadow-[0_10px_28px_hsl(var(--foreground)/0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/60"
            >
              <div className="pointer-events-none absolute inset-1.5">
                <div className="relative h-full">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 w-1/5 rounded-xl border bg-background/65 shadow-[0_6px_18px_hsl(var(--foreground)/0.08),inset_0_1px_0_hsl(var(--background)/0.5)] backdrop-blur-md transition-[transform,opacity] duration-300 ease-out dark:border-white/15 dark:bg-white/8 dark:shadow-[0_8px_20px_hsl(0_0%_0%/0.32),inset_0_1px_0_hsl(0_0%_100%/0.06)]",
                      hasActiveTab
                        ? "opacity-100 border-foreground/10"
                        : "opacity-0 border-transparent",
                    )}
                    style={{
                      transform: `translate3d(${Math.max(activeTabIndex, 0) * 100}%, 0, 0)`,
                    }}
                  />
                </div>
              </div>

              {MOBILE_DOCK_TABS.map((tab, index) => {
                if (tab.kind === "route") {
                  const isActive = index === activeRouteIndex && !menuOpen;

                  return (
                    <MobileRouteTabLink
                      key={tab.href}
                      href={tab.href}
                      icon={tab.icon}
                      label={tab.label}
                      isActive={isActive}
                    />
                  );
                }

                return (
                  <MobileActionTabButton
                    key={tab.id}
                    onClick={() => setMenuOpen(true)}
                    icon={tab.icon}
                    label={tab.label}
                    isActive={menuOpen}
                  />
                );
              })}
            </nav>
          </div>

          <div className="pointer-events-auto flex size-[4.25rem] items-center justify-center rounded-full border border-border/60 bg-background/72 p-1.5 shadow-[0_10px_28px_hsl(var(--foreground)/0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/60">
            <AvatarMenu
              dropdownSide="top"
              triggerClassName="h-full w-full"
            />
          </div>
        </div>
      </div>

      <MobileNavSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}

type MobileRouteTabLinkProps = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
};

const MobileRouteTabLink = memo(function MobileRouteTabLink({
  href,
  icon: Icon,
  label,
  isActive,
}: MobileRouteTabLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative z-10 flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 text-[11px] leading-none transition-colors duration-200",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-transform duration-200",
          isActive ? "scale-100" : "scale-95",
        )}
      />
      <span className="max-w-full truncate font-medium">{label}</span>
    </Link>
  );
});

type MobileActionTabButtonProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
};

const MobileActionTabButton = memo(function MobileActionTabButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: MobileActionTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative z-10 flex h-full min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1.5 text-[11px] leading-none transition-colors duration-200",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-label="Open menu"
      aria-haspopup="dialog"
      aria-expanded={isActive}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-transform duration-200",
          isActive ? "scale-100" : "scale-95",
        )}
      />
      <span className="max-w-full truncate font-medium">{label}</span>
    </button>
  );
});
