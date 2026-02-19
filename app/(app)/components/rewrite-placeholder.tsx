import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RewritePlaceholderProps = {
  title: string;
  subtitle?: ReactNode;
  cardTitle: string;
  cardDescription: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function RewritePlaceholder({
  actions,
  backHref,
  backLabel = "Back to Library",
  cardDescription,
  cardTitle,
  subtitle,
  title,
}: RewritePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>

        {(actions || backHref) ? (
          <CardContent className="flex flex-wrap gap-3">
            {actions}
            {backHref ? (
              <Button asChild variant="outline">
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    </section>
  );
}
