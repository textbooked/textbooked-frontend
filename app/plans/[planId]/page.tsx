"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPlan, updatePlanItemStatus } from "@/lib/api/endpoints";
import type { PlanDetail, PlanItem, PlanItemStatus } from "@/lib/api/models";
import { isApiError } from "@/lib/api/request";
import { formatDate, groupPlanItemsByWeek } from "@/lib/utils/date";
import { parseRequiredUuid } from "@/lib/utils/uuid";

export default function PlanPage() {
  const params = useParams<{ planId: string }>();
  const planId = useMemo(() => parseRequiredUuid(params.planId), [params.planId]);

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    if (!planId) {
      setError("Invalid plan id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getPlan(planId);
      setPlan(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load plan.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  async function toggleStatus(item: PlanItem) {
    if (!plan) {
      return;
    }

    const nextStatus: PlanItemStatus = item.status === "TODO" ? "DONE" : "TODO";
    const snapshot = plan;

    setUpdatingItemId(item.id);
    setPlan((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        planItems: current.planItems.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: nextStatus,
              }
            : candidate,
        ),
      };
    });

    try {
      const updated = await updatePlanItemStatus(item.id, nextStatus);
      setPlan((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          planItems: current.planItems.map((candidate) =>
            candidate.id === updated.id ? { ...candidate, ...updated } : candidate,
          ),
        };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status.";

      if (isApiError(err) && err.status === 404) {
        toast.warning(
          "Backend is missing PATCH /plan-items/:id/status. Kept local status for this session only.",
        );
      } else {
        setPlan(snapshot);
        toast.error(message);
      }
    } finally {
      setUpdatingItemId(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading plan..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        message={error}
        action={
          <Button type="button" variant="outline" onClick={() => void loadPlan()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!plan) {
    return <ErrorAlert message="Plan was not found." />;
  }

  const groupedItems = groupPlanItemsByWeek(plan.planItems);
  const doneCount = plan.planItems.filter((item) => item.status === "DONE").length;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Plan #{plan.id}</h1>
          <p className="text-sm text-muted-foreground">
            {plan.book.title} • starts {formatDate(plan.startDate)}
          </p>
        </div>

        <Button asChild variant="ghost">
          <Link href={`/books/${plan.bookId}`}>
            <ArrowLeft className="size-4" />
            Back to Book
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {doneCount} / {plan.planItems.length} items done
          </p>
          <p>
            Pace: {plan.paceOption.name} ({plan.paceOption.sessionsPerWeek} sessions/week, {" "}
            {plan.paceOption.minutesPerSession} min/session)
          </p>
        </CardContent>
      </Card>

      {groupedItems.length === 0 ? (
        <EmptyState title="No plan items" description="This plan has no generated items." />
      ) : (
        <div className="space-y-5">
          {groupedItems.map((week) => (
            <Card key={week.weekKey}>
              <CardHeader>
                <CardTitle className="text-base">{week.weekLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {week.dates.map((dateGroup, index) => (
                  <div key={dateGroup.dateKey} className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {dateGroup.dateLabel}
                    </p>

                    <div className="space-y-2">
                      {dateGroup.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{item.type}</Badge>
                              <Badge
                                variant={item.status === "DONE" ? "secondary" : "outline"}
                              >
                                {item.status}
                              </Badge>
                            </div>

                            <Link
                              href={`/toc/${item.tocNodeId}?bookId=${plan.bookId}`}
                              className="text-sm font-medium hover:underline"
                            >
                              {item.tocNode.title}
                            </Link>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updatingItemId === item.id}
                            onClick={() => void toggleStatus(item)}
                          >
                            {updatingItemId === item.id
                              ? "Updating..."
                              : item.status === "TODO"
                                ? "Mark Done"
                                : "Mark TODO"}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {index < week.dates.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
