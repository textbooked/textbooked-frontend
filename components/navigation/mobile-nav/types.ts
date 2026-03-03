import type { ComponentType } from "react";

export type NavIconComponent = ComponentType<{ className?: string }>;

export type MobileRouteTab = {
  kind: "route";
  href: string;
  label: string;
  icon: NavIconComponent;
  match: (pathname: string) => boolean;
};

export type MobileActionTab = {
  kind: "action";
  id: "menu";
  label: string;
  icon: NavIconComponent;
};

export type MobileBottomDockTab = MobileRouteTab | MobileActionTab;

export type MobileNavLinkItem = {
  href: string;
  label: string;
  icon: NavIconComponent;
  match: (pathname: string) => boolean;
};
