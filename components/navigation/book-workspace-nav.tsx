"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type WorkspaceTarget = "player" | "toc" | "pace" | "plan";

type BookWorkspaceNavProps = {
  playerHref: string;
  tocHref: string;
  paceHref: string;
  planHref?: string | null;
  active: WorkspaceTarget;
  className?: string;
};

export function BookWorkspaceNav({
  playerHref,
  tocHref,
  paceHref,
  planHref,
  active,
  className,
}: BookWorkspaceNavProps) {
  return (
    <nav
      aria-label="Book workspace navigation"
      className={cn(
        "sticky top-2 z-20 rounded-lg border bg-background/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Workspace
        </span>

        <WorkspaceLink href={playerHref} active={active === "player"}>
          Player
        </WorkspaceLink>
        <WorkspaceLink href={tocHref} active={active === "toc"}>
          ToC
        </WorkspaceLink>
        <WorkspaceLink href={paceHref} active={active === "pace"}>
          Pace &amp; Plan
        </WorkspaceLink>
        {planHref ? (
          <WorkspaceLink href={planHref} active={active === "plan"}>
            Plan
          </WorkspaceLink>
        ) : null}
      </div>
    </nav>
  );
}

type WorkspaceLinkProps = {
  href: string;
  active: boolean;
  children: React.ReactNode;
};

function WorkspaceLink({ href, active, children }: WorkspaceLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
