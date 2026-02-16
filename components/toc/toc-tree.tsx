"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TocTreeNode } from "@/lib/api/models";

type TocTreeProps = {
  nodes: TocTreeNode[];
  linkToNodes?: boolean;
  bookId?: string;
  planId?: string;
  className?: string;
};

export function TocTree({
  nodes,
  linkToNodes = false,
  bookId,
  planId,
  className,
}: TocTreeProps) {
  const initiallyExpanded = useMemo(
    () => new Set(nodes.map((node) => node.id)),
    [nodes],
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(initiallyExpanded);

  function toggle(nodeId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  }

  if (nodes.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No ToC nodes yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {nodes.map((node) => (
        <TocNodeRow
          key={node.id}
          node={node}
          expandedIds={expandedIds}
          onToggle={toggle}
          linkToNodes={linkToNodes}
          bookId={bookId}
          planId={planId}
        />
      ))}
    </div>
  );
}

type TocNodeRowProps = {
  node: TocTreeNode;
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
  linkToNodes: boolean;
  bookId?: string;
  planId?: string;
};

function TocNodeRow({
  node,
  expandedIds,
  onToggle,
  linkToNodes,
  bookId,
  planId,
}: TocNodeRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const nodeHref = buildNodeHref(node.id, bookId, planId);

  return (
    <div>
      <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? "Collapse node" : "Expand node"}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        ) : (
          <span className="inline-block size-6" />
        )}

        <FileText className="size-4 text-muted-foreground" />

        {linkToNodes ? (
          <Link href={nodeHref} className="text-sm hover:underline">
            {node.title}
          </Link>
        ) : (
          <p className="text-sm">{node.title}</p>
        )}
      </div>

      {hasChildren && isExpanded ? (
        <div className="ml-5 border-l border-border pl-3">
          {node.children.map((child) => (
            <TocNodeRow
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              linkToNodes={linkToNodes}
              bookId={bookId}
              planId={planId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildNodeHref(nodeId: string, bookId?: string, planId?: string): string {
  if (!bookId) {
    return `/toc/${nodeId}`;
  }

  const query = new URLSearchParams({
    bookId,
  });

  if (planId) {
    query.set("planId", planId);
  }

  return `/toc/${nodeId}?${query.toString()}`;
}
