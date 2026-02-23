"use client";

import { usePathname, useRouter } from "next/navigation";
import { Compass, Home, LibraryBig, Menu, Network } from "lucide-react";
import type {
  ComponentType,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
} from "react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragPreviewIndex, setDragPreviewIndex] = useState<number | null>(null);
  const [dragIndicatorLeftPercent, setDragIndicatorLeftPercent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isIndicatorSliding, setIsIndicatorSliding] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const dragActivatedRef = useRef(false);
  const suppressPointerClickRef = useRef(false);
  const releaseCleanupTimerRef = useRef<number | null>(null);
  const dragPreviewCleanupTimerRef = useRef<number | null>(null);
  const indicatorSlideTimerRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);

  const activeRouteIndex = useMemo(
    () =>
      MOBILE_DOCK_TABS.findIndex(
        (tab) => tab.kind === "route" && tab.match(pathname),
      ),
    [pathname],
  );

  const activeTabIndex = menuOpen ? MOBILE_DOCK_TABS.length - 1 : activeRouteIndex;
  const hasActiveTab = activeTabIndex >= 0;
  const displayActiveIndex = dragPreviewIndex ?? activeTabIndex;
  const activeIndicatorLeftPercent =
    displayActiveIndex >= 0 ? (displayActiveIndex * 100) / MOBILE_DOCK_TABS.length : 0;

  useEffect(() => {
    return () => {
      if (releaseCleanupTimerRef.current) {
        window.clearTimeout(releaseCleanupTimerRef.current);
      }
      if (dragPreviewCleanupTimerRef.current) {
        window.clearTimeout(dragPreviewCleanupTimerRef.current);
      }
      if (indicatorSlideTimerRef.current) {
        window.clearTimeout(indicatorSlideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (activeTabIndex < 0) {
      return;
    }

    if (indicatorSlideTimerRef.current) {
      window.clearTimeout(indicatorSlideTimerRef.current);
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsIndicatorSliding(true);
    });

    indicatorSlideTimerRef.current = window.setTimeout(() => {
      setIsIndicatorSliding(false);
      indicatorSlideTimerRef.current = null;
    }, 220);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (indicatorSlideTimerRef.current) {
        window.clearTimeout(indicatorSlideTimerRef.current);
        indicatorSlideTimerRef.current = null;
      }
    };
  }, [activeTabIndex]);

  const clearDragState = () => {
    setIsDragging(false);
    setDragPreviewIndex(null);
    setDragIndicatorLeftPercent(null);
    activePointerIdRef.current = null;
    pointerStartXRef.current = null;
    dragActivatedRef.current = false;
  };

  const resolveDragTarget = (clientX: number) => {
    const track = trackRef.current;
    if (!track) {
      return null;
    }

    const rect = track.getBoundingClientRect();
    const tabCount = MOBILE_DOCK_TABS.length;
    const tabWidth = rect.width / tabCount;
    if (tabWidth <= 0) {
      return null;
    }

    const pointerX = clientX - rect.left;
    const clampedPointerX = Math.min(Math.max(pointerX, 0), rect.width);
    const rawIndex = Math.floor(clampedPointerX / tabWidth);
    const index = Math.min(Math.max(rawIndex, 0), tabCount - 1);
    const leftPx = Math.min(
      Math.max(clampedPointerX - tabWidth / 2, 0),
      Math.max(rect.width - tabWidth, 0),
    );

    return {
      index,
      leftPercent: rect.width > 0 ? (leftPx / rect.width) * 100 : 0,
    };
  };

  const commitTabSelection = (index: number) => {
    const tab = MOBILE_DOCK_TABS[index];
    if (!tab) {
      return;
    }

    if (tab.kind === "action") {
      setMenuOpen(true);
      return;
    }

    if (!tab.match(pathname)) {
      setMenuOpen(false);
      router.push(tab.href);
      return;
    }
  };

  const markPointerSelectionHandled = () => {
    suppressPointerClickRef.current = true;
    if (releaseCleanupTimerRef.current) {
      window.clearTimeout(releaseCleanupTimerRef.current);
    }
    releaseCleanupTimerRef.current = window.setTimeout(() => {
      suppressPointerClickRef.current = false;
      releaseCleanupTimerRef.current = null;
    }, 50);
  };

  const handleNavPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!navRef.current) {
      return;
    }

    if (event.button !== 0 && event.pointerType === "mouse") {
      return;
    }

    const target = resolveDragTarget(event.clientX);
    if (!target) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    pointerStartXRef.current = event.clientX;
    dragActivatedRef.current = false;

    try {
      navRef.current.setPointerCapture(event.pointerId);
    } catch {
      // Some mobile browsers can be picky about pointer capture; fallback still works.
    }
  };

  const handleNavPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const target = resolveDragTarget(event.clientX);
    if (!target) {
      return;
    }

    const startX = pointerStartXRef.current;
    const moveDistance = startX == null ? 0 : Math.abs(event.clientX - startX);

    if (!dragActivatedRef.current && moveDistance >= 8) {
      dragActivatedRef.current = true;
      setIsDragging(true);
      setIsIndicatorSliding(false);
      if (indicatorSlideTimerRef.current) {
        window.clearTimeout(indicatorSlideTimerRef.current);
        indicatorSlideTimerRef.current = null;
      }
    }

    if (!dragActivatedRef.current) {
      return;
    }

    setDragPreviewIndex(target.index);
    setDragIndicatorLeftPercent(target.leftPercent);
  };

  const handleNavPointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const target = resolveDragTarget(event.clientX);
    const shouldCommitFromDrag = dragActivatedRef.current;

    if (shouldCommitFromDrag) {
      markPointerSelectionHandled();

      const targetIndex = target?.index ?? dragPreviewIndex;
      if (targetIndex != null) {
        // Hold the selection briefly while navigation updates to avoid snap-back.
        setIsDragging(false);
        setDragPreviewIndex(targetIndex);
        setDragIndicatorLeftPercent(null);

        if (dragPreviewCleanupTimerRef.current) {
          window.clearTimeout(dragPreviewCleanupTimerRef.current);
        }
        dragPreviewCleanupTimerRef.current = window.setTimeout(() => {
          setDragPreviewIndex(null);
          setDragIndicatorLeftPercent(null);
          dragPreviewCleanupTimerRef.current = null;
        }, 260);

        commitTabSelection(targetIndex);
      }
    }

    if (navRef.current?.hasPointerCapture(event.pointerId)) {
      try {
        navRef.current.releasePointerCapture(event.pointerId);
      } catch {
        // noop
      }
    }

    if (!shouldCommitFromDrag) {
      clearDragState();
      return;
    }

    activePointerIdRef.current = null;
    pointerStartXRef.current = null;
    dragActivatedRef.current = false;
  };

  const handleNavPointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    if (navRef.current?.hasPointerCapture(event.pointerId)) {
      try {
        navRef.current.releasePointerCapture(event.pointerId);
      } catch {
        // noop
      }
    }

    clearDragState();
  };

  const handleTabActivate = (index: number) => {
    if (suppressPointerClickRef.current) {
      return;
    }

    commitTabSelection(index);
  };

  const indicatorScaleY = isDragging ? 0.94 : isIndicatorSliding ? 0.965 : 1;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <div className="pointer-events-auto min-w-0 flex-1">
            <nav
              ref={navRef}
              aria-label="Primary navigation"
              className="relative grid h-[4.25rem] grid-cols-5 touch-pan-y rounded-[1.35rem] border border-border/60 bg-background/70 p-1.5 shadow-[0_10px_28px_hsl(var(--foreground)/0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/60"
              onPointerDown={handleNavPointerDown}
              onPointerMove={handleNavPointerMove}
              onPointerUp={handleNavPointerEnd}
              onPointerCancel={handleNavPointerCancel}
            >
              <div ref={trackRef} className="pointer-events-none absolute inset-1.5">
                <div className="relative h-full">
                  <span
                    className={cn(
                      "absolute inset-y-0 w-1/5 rounded-xl border bg-background/60 shadow-[0_6px_18px_hsl(var(--foreground)/0.08),inset_0_1px_0_hsl(var(--background)/0.55)] backdrop-blur-md transition-[left,opacity,transform] duration-300 ease-out will-change-transform dark:bg-white/8 dark:shadow-[0_8px_20px_hsl(0_0%_0%/0.32),inset_0_1px_0_hsl(0_0%_100%/0.06)]",
                      hasActiveTab
                        ? "opacity-100 border-foreground/12 dark:border-white/14"
                        : "opacity-0 border-transparent",
                      isDragging ? "transition-none" : "",
                    )}
                    style={{
                      left:
                        dragIndicatorLeftPercent != null
                          ? `${dragIndicatorLeftPercent}%`
                          : `${activeIndicatorLeftPercent}%`,
                      transform: `scaleY(${indicatorScaleY})`,
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
                      icon={tab.icon}
                      label={tab.label}
                      isActive={isActive}
                      onActivate={() => handleTabActivate(index)}
                      suppressPointerClickRef={suppressPointerClickRef}
                    />
                  );
                }

                return (
                  <MobileActionTabButton
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    isActive={menuOpen}
                    onActivate={() => handleTabActivate(index)}
                    suppressPointerClickRef={suppressPointerClickRef}
                  />
                );
              })}
            </nav>
          </div>

          <div className="pointer-events-auto flex size-[4.25rem] items-center justify-center rounded-full border border-border/60 bg-background/72 p-1.5 shadow-[0_10px_28px_hsl(var(--foreground)/0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/60">
            <AvatarMenu
              dropdownSide="top"
              triggerClassName="h-full w-full"
              avatarSizeClassName="h-full w-full"
              showAvatarRing={false}
            />
          </div>
        </div>
      </div>

      <MobileNavSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}

type MobileRouteTabLinkProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  onActivate: () => void;
  suppressPointerClickRef: MutableRefObject<boolean>;
};

const MobileRouteTabLink = memo(function MobileRouteTabLink({
  icon: Icon,
  label,
  isActive,
  onActivate,
  suppressPointerClickRef,
}: MobileRouteTabLinkProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (suppressPointerClickRef.current) {
          suppressPointerClickRef.current = false;
          return;
        }
        onActivate();
      }}
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
    </button>
  );
});

type MobileActionTabButtonProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  onActivate: () => void;
  suppressPointerClickRef: MutableRefObject<boolean>;
};

const MobileActionTabButton = memo(function MobileActionTabButton({
  icon: Icon,
  label,
  isActive,
  onActivate,
  suppressPointerClickRef,
}: MobileActionTabButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (suppressPointerClickRef.current) {
          suppressPointerClickRef.current = false;
          return;
        }
        onActivate();
      }}
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
