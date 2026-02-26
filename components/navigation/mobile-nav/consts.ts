import {
  BookPlus,
  Compass,
  Home,
  LibraryBig,
  Menu,
  Network,
  Sparkles,
} from "lucide-react";

import type {
  MobileActionTab,
  MobileBottomDockTab,
  MobileNavLinkItem,
} from "@/components/navigation/mobile-nav/types";

export const DRAG_ACTIVATION_DISTANCE_PX = 8;
export const POINTER_CLICK_SUPPRESS_MS = 50;
export const DRAG_PREVIEW_HOLD_MS = 260;
export const INDICATOR_SLIDE_ANIMATION_MS = 220;
export const INDICATOR_SCALE_DRAG = 0.94;
export const INDICATOR_SCALE_SLIDE = 0.965;

export const MOBILE_PRIMARY_ROUTE_ITEMS = [
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
    label: "Graph",
    icon: Network,
    match: (pathname) => pathname.startsWith("/knowledge-graph"),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: (pathname) => pathname.startsWith("/explore"),
  },
] satisfies readonly MobileNavLinkItem[];

export const MOBILE_MENU_ACTION_TAB = {
  kind: "action",
  id: "menu",
  label: "Menu",
  icon: Menu,
} satisfies MobileActionTab;

export const MOBILE_DOCK_TABS = [
  ...MOBILE_PRIMARY_ROUTE_ITEMS.map((item) => ({
    kind: "route" as const,
    ...item,
  })),
  MOBILE_MENU_ACTION_TAB,
] satisfies readonly MobileBottomDockTab[];

export const MOBILE_DOCK_TAB_COUNT = MOBILE_DOCK_TABS.length;

export const MOBILE_NAV_SHEET_ITEMS = [
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
] satisfies readonly MobileNavLinkItem[];

export const MOBILE_NAV_SHORTCUT_ITEMS = [
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
] satisfies readonly MobileNavLinkItem[];
