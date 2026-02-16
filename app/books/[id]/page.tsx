"use client";

import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { TocTree } from "@/components/toc/toc-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createPlan,
  deriveBookOverviewSummary,
  generatePaces,
  getBook,
  getBookToc,
  getLatestPlanForBook,
  listPaceOptions,
  pickCurrentPlanItem,
  updatePlanItemStatus,
} from "@/lib/api/endpoints";
import type {
  BookDetail,
  BookOverviewSummary,
  PaceOption,
  PlanDetail,
  PlanItem,
  PlanItemStatus,
  PlanItemType,
  TocTreeResponse,
} from "@/lib/api/models";
import { isApiError } from "@/lib/api/request";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDateTime,
  groupPlanItemsByWeekAndSection,
  todayIsoDate,
  type GroupedPlanItemsByWeekAndSection,
} from "@/lib/utils/date";
import { parseRequiredUuid } from "@/lib/utils/uuid";

type WorkspaceView = "plan" | "overview" | "toc";

const ACTIVITY_TYPE_LABEL: Record<PlanItemType, string> = {
  READ: "Reading",
  ASSIGNMENT: "Assignment",
  REVIEW: "Review",
  TEST: "Test",
};

export default function BookOverviewPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = useMemo(() => parseRequiredUuid(params.id), [params.id]);

  const activeView = useMemo<WorkspaceView>(
    () => parseWorkspaceView(searchParams.get("view")),
    [searchParams],
  );

  const [book, setBook] = useState<BookDetail | null>(null);
  const [toc, setToc] = useState<TocTreeResponse | null>(null);
  const [latestPlan, setLatestPlan] = useState<PlanDetail | null>(null);
  const [paceOptions, setPaceOptions] = useState<PaceOption[]>([]);
  const [selectedPaceId, setSelectedPaceId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIsoDate());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreparingPaces, setIsPreparingPaces] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const currentItemRef = useRef<HTMLDivElement | null>(null);

  const setView = useCallback(
    (nextView: WorkspaceView) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (nextView === "plan") {
        nextParams.delete("view");
      } else {
        nextParams.set("view", nextView);
      }

      const nextHref = nextParams.toString()
        ? `${pathname}?${nextParams.toString()}`
        : pathname;

      router.replace(nextHref, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadBookState = useCallback(async () => {
    if (!bookId) {
      setError("Invalid book id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [bookData, tocData, latestPlanData] = await Promise.all([
        getBook(bookId),
        getBookToc(bookId),
        getLatestPlanForBook(bookId),
      ]);

      let loadedPaces: PaceOption[] = [];
      if (!latestPlanData) {
        try {
          const paces = await listPaceOptions(bookId);
          loadedPaces = paces.options;
        } catch (paceError: unknown) {
          if (!(isApiError(paceError) && paceError.status === 404)) {
            throw paceError;
          }
        }
      }

      setBook(bookData);
      setToc(tocData);
      setLatestPlan(latestPlanData);
      setPaceOptions(loadedPaces);
      setSelectedPaceId(latestPlanData?.paceOptionId ?? loadedPaces[0]?.id ?? null);

      if (latestPlanData?.startDate) {
        setStartDate(latestPlanData.startDate.slice(0, 10));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load book.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void loadBookState();
  }, [loadBookState]);

  const currentPlanItem = useMemo(
    () => pickCurrentPlanItem(latestPlan),
    [latestPlan],
  );

  const weekGroups = useMemo(
    () => groupPlanItemsByWeekAndSection(latestPlan?.planItems ?? []),
    [latestPlan],
  );

  const overview = useMemo<BookOverviewSummary | null>(() => {
    if (!book) {
      return null;
    }

    return deriveBookOverviewSummary(book, latestPlan);
  }, [book, latestPlan]);

  const progressTotals = useMemo(() => {
    const totalItems = latestPlan?.planItems.length ?? 0;
    const doneItems =
      latestPlan?.planItems.filter((item) => item.status === "DONE").length ?? 0;
    const percentComplete =
      totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return {
      doneItems,
      totalItems,
      percentComplete,
    };
  }, [latestPlan]);

  useEffect(() => {
    if (activeView !== "plan" || !currentPlanItem) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      currentItemRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [activeView, currentPlanItem]);

  async function onPreparePaces() {
    if (!bookId) {
      toast.error("Invalid book id.");
      return;
    }

    setIsPreparingPaces(true);

    try {
      const response = await generatePaces(bookId);
      setPaceOptions(response.options);
      setSelectedPaceId((current) => current ?? response.options[0]?.id ?? null);
      toast.success("Pace options are ready.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to prepare pace options.";
      toast.error(message);
    } finally {
      setIsPreparingPaces(false);
    }
  }

  async function onCreatePlan() {
    if (!bookId) {
      toast.error("Invalid book id.");
      return;
    }

    if (!selectedPaceId) {
      toast.error("Select a pace option first.");
      return;
    }

    setIsCreatingPlan(true);

    try {
      const createdPlan = await createPlan(bookId, {
        paceOptionId: selectedPaceId,
        startDate,
      });

      setLatestPlan(createdPlan);
      setSelectedPaceId(createdPlan.paceOptionId);
      toast.success("Plan created.");
      setView("plan");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create plan.";
      toast.error(message);
    } finally {
      setIsCreatingPlan(false);
    }
  }

  async function toggleStatus(item: PlanItem) {
    if (!latestPlan) {
      return;
    }

    const nextStatus: PlanItemStatus = item.status === "TODO" ? "DONE" : "TODO";
    const snapshot = latestPlan;

    setUpdatingItemId(item.id);
    setLatestPlan((current) => {
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
      setLatestPlan((current) => {
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
        setLatestPlan(snapshot);
        toast.error(message);
      }
    } finally {
      setUpdatingItemId(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading book..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        message={error}
        action={
          <Button type="button" variant="outline" onClick={() => void loadBookState()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!book) {
    return <ErrorAlert message="Book was not found." />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <ViewSwitcher activeView={activeView} onViewChange={setView} />

      {activeView === "plan" ? (
        <PlanMode
          bookId={book.id}
          plan={latestPlan}
          weeks={weekGroups}
          currentItemId={currentPlanItem?.id ?? null}
          currentItemRef={currentItemRef}
          progressTotals={progressTotals}
          currentChapter={overview?.currentChapterOrSection ?? "Not started yet"}
          isUpdatingItemId={updatingItemId}
          onToggleStatus={toggleStatus}
        />
      ) : null}

      {activeView === "overview" ? (
        <OverviewMode
          plan={latestPlan}
          overview={overview}
          paceOptions={paceOptions}
          selectedPaceId={selectedPaceId}
          startDate={startDate}
          isPreparingPaces={isPreparingPaces}
          isCreatingPlan={isCreatingPlan}
          onSelectedPaceIdChange={setSelectedPaceId}
          onStartDateChange={setStartDate}
          onPreparePaces={onPreparePaces}
          onCreatePlan={onCreatePlan}
        />
      ) : null}

      {activeView === "toc" ? <TocMode toc={toc} /> : null}
    </section>
  );
}

type ViewSwitcherProps = {
  activeView: WorkspaceView;
  onViewChange: (nextView: WorkspaceView) => void;
};

function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  const views: Array<{ value: WorkspaceView; label: string }> = [
    { value: "plan", label: "Plan" },
    { value: "overview", label: "Overview" },
    { value: "toc", label: "ToC" },
  ];

  return (
    <div className="inline-flex w-full rounded-lg border bg-muted/20 p-1 sm:w-auto">
      {views.map((view) => (
        <button
          key={view.value}
          type="button"
          onClick={() => onViewChange(view.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            activeView === view.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

type PlanModeProps = {
  bookId: string;
  plan: PlanDetail | null;
  weeks: GroupedPlanItemsByWeekAndSection;
  currentItemId: string | null;
  currentItemRef: React.RefObject<HTMLDivElement | null>;
  progressTotals: {
    doneItems: number;
    totalItems: number;
    percentComplete: number;
  };
  currentChapter: string;
  isUpdatingItemId: string | null;
  onToggleStatus: (item: PlanItem) => Promise<void>;
};

function PlanMode({
  bookId,
  plan,
  weeks,
  currentItemId,
  currentItemRef,
  progressTotals,
  currentChapter,
  isUpdatingItemId,
  onToggleStatus,
}: PlanModeProps) {
  if (!plan) {
    return (
      <EmptyState
        title="No active plan"
        description="Open Overview to generate pace options and create your first plan."
      />
    );
  }

  const hasAnyActivities = weeks.some((week) =>
    week.sections.some((section) => section.activities.length > 0),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="order-2 space-y-4 lg:order-1">
        {!hasAnyActivities ? (
          <EmptyState
            title="No activities yet"
            description="This plan does not have scheduled activities yet."
          />
        ) : (
          weeks.map((week) => (
            <Card key={week.weekKey}>
              <CardHeader>
                <CardTitle className="text-base">{week.weekLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {week.sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sections this week.</p>
                ) : (
                  week.sections.map((section) => (
                    <div key={section.sectionId} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold">
                          {section.sectionTitle}
                        </p>
                        <Badge variant="outline">Section</Badge>
                      </div>

                      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Activities
                      </p>

                      <div className="mt-2 space-y-2">
                        {section.activities.map((item) => {
                          const isCurrent = item.id === currentItemId;

                          return (
                            <div
                              key={item.id}
                              ref={isCurrent ? currentItemRef : null}
                              className={cn(
                                "rounded-md border p-3",
                                isCurrent ? "border-primary bg-primary/5" : "bg-background",
                              )}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{ACTIVITY_TYPE_LABEL[item.type]}</Badge>
                                <Badge variant="outline">{formatDate(item.date)}</Badge>
                                <Badge
                                  variant={item.status === "DONE" ? "secondary" : "outline"}
                                >
                                  {item.status}
                                </Badge>
                                {isCurrent ? <Badge>Current</Badge> : null}
                              </div>

                              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                <Link
                                  href={buildTocHref(item.tocNodeId, bookId, plan.id, item.type)}
                                  className="text-sm font-medium hover:underline"
                                >
                                  Open activity
                                </Link>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isUpdatingItemId === item.id}
                                  onClick={() => void onToggleStatus(item)}
                                >
                                  {isUpdatingItemId === item.id
                                    ? "Updating..."
                                    : item.status === "TODO"
                                      ? "Mark Done"
                                      : "Mark TODO"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <aside className="order-1 lg:order-2">
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <ProgressRing percent={progressTotals.percentComplete} />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {progressTotals.doneItems} / {progressTotals.totalItems} complete
                </p>
                <p className="text-xs text-muted-foreground">{currentChapter}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

type OverviewModeProps = {
  plan: PlanDetail | null;
  overview: BookOverviewSummary | null;
  paceOptions: PaceOption[];
  selectedPaceId: string | null;
  startDate: string;
  isPreparingPaces: boolean;
  isCreatingPlan: boolean;
  onSelectedPaceIdChange: (paceId: string) => void;
  onStartDateChange: (value: string) => void;
  onPreparePaces: () => Promise<void>;
  onCreatePlan: () => Promise<void>;
};

function OverviewMode({
  plan,
  overview,
  paceOptions,
  selectedPaceId,
  startDate,
  isPreparingPaces,
  isCreatingPlan,
  onSelectedPaceIdChange,
  onStartDateChange,
  onPreparePaces,
  onCreatePlan,
}: OverviewModeProps) {
  if (!overview) {
    return <ErrorAlert message="Overview is unavailable." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <OverviewStatCard
          label="Overall"
          value={`${overview.overallPercent}%`}
          detail="Activity completion"
        />
        <OverviewStatCard
          label="Sections"
          value={`${overview.sections.completed} / ${overview.sections.total}`}
          detail={`${overview.sections.percentComplete}% complete`}
        />
        <OverviewStatCard
          label="Assignment Activities"
          value={`${overview.assignments.completed} / ${overview.assignments.total}`}
          detail={`${overview.assignments.percentComplete}% complete`}
        />
        <OverviewStatCard
          label="Review Activities"
          value={`${overview.reviews.completed} / ${overview.reviews.total}`}
          detail={`${overview.reviews.percentComplete}% complete`}
        />
        <OverviewStatCard
          label="Test Activities"
          value={`${overview.tests.completed} / ${overview.tests.total}`}
          detail={`${overview.tests.percentComplete}% complete`}
        />
        <OverviewStatCard
          label="Questions"
          value={
            overview.questions
              ? `${overview.questions.completed} / ${overview.questions.total}`
              : "Unavailable"
          }
          detail={
            overview.questions
              ? `${overview.questions.percentComplete}% complete`
              : "Waiting for backend question summary"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Section</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base font-semibold">{overview.currentChapterOrSection}</p>
        </CardContent>
      </Card>

      {plan ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Pace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">{plan.paceOption.name}</p>
            <p className="text-muted-foreground">
              {plan.paceOption.sessionsPerWeek} sessions/week • {" "}
              {plan.paceOption.minutesPerSession} min/session
            </p>
            <p className="text-muted-foreground">Start date: {formatDate(plan.startDate)}</p>
            <p className="text-muted-foreground">
              Plan created: {formatDateTime(plan.createdAt)}
            </p>
            <div className="space-y-2 pt-2">
              <Button type="button" variant="outline" disabled>
                <RotateCcw className="size-4" />
                Restart Progress
              </Button>
              <p className="text-xs text-muted-foreground">
                Restart and pace re-selection will unlock when backend exposes
                <code> POST /books/:id/restart-progress</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Your First Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paceOptions.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No pace options yet. Prepare suggested pace options to begin.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onPreparePaces()}
                  disabled={isPreparingPaces}
                >
                  {isPreparingPaces ? "Preparing..." : "Prepare Pace Options"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paceOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center justify-between rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{option.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.sessionsPerWeek} sessions/week • {option.minutesPerSession} min/session
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="pace-option"
                      checked={selectedPaceId === option.id}
                      onChange={() => onSelectedPaceIdChange(option.id)}
                    />
                  </label>
                ))}

                <div className="grid gap-2 sm:max-w-xs">
                  <label htmlFor="startDate" className="text-sm font-medium">
                    Start Date
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) => onStartDateChange(event.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => void onCreatePlan()}
                  disabled={isCreatingPlan || !selectedPaceId}
                >
                  {isCreatingPlan ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type TocModeProps = {
  toc: TocTreeResponse | null;
};

function TocMode({ toc }: TocModeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Table of Contents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {toc && toc.nodes.length > 0 ? (
          <TocTree nodes={toc.nodes} interactionMode="expand-only" />
        ) : (
          <EmptyState
            title="No ToC found"
            description="This book has no parsed table of contents."
          />
        )}

        <p className="text-xs text-muted-foreground">
          Expand sections to inspect structure. Node clicks do not navigate in this view.
        </p>
      </CardContent>
    </Card>
  );
}

type OverviewStatCardProps = {
  label: string;
  value: string;
  detail: string;
};

function OverviewStatCard({ label, value, detail }: OverviewStatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

type ProgressRingProps = {
  percent: number;
};

function ProgressRing({ percent }: ProgressRingProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  const size = 72;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safePercent / 100) * circumference;

  return (
    <div className="relative size-[72px]" title="Overall progress">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="stroke-primary transition-[stroke-dashoffset] duration-300"
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {safePercent}%
      </span>
    </div>
  );
}

function parseWorkspaceView(value: string | null): WorkspaceView {
  if (value === "overview" || value === "toc") {
    return value;
  }

  return "plan";
}

function buildTocHref(
  nodeId: string,
  bookId: string,
  planId?: string,
  activity?: PlanItemType,
): string {
  const query = new URLSearchParams({
    bookId,
  });

  if (planId) {
    query.set("planId", planId);
  }

  if (activity) {
    query.set("activity", activity);
  }

  return `/toc/${nodeId}?${query.toString()}`;
}
