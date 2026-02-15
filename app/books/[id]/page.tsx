"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { TocTree } from "@/components/toc/toc-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createPlan,
  generatePaces,
  getBook,
  getBookAssignmentGenerationStatus,
  getBookToc,
  getLatestPlanForBook,
  listPaceOptions,
} from "@/lib/api/endpoints";
import type {
  BookAssignmentGenerationStatus,
  BookDetail,
  PaceGenerationResponse,
  PaceOption,
  PlanDetail,
  TocTreeResponse,
} from "@/lib/api/models";
import { isApiError } from "@/lib/api/request";
import { formatDateTime, todayIsoDate } from "@/lib/utils/date";
import { parseRequiredUuid } from "@/lib/utils/uuid";

export default function BookOverviewPage() {
  const params = useParams<{ id: string }>();
  const bookId = useMemo(() => parseRequiredUuid(params.id), [params.id]);

  const [book, setBook] = useState<BookDetail | null>(null);
  const [toc, setToc] = useState<TocTreeResponse | null>(null);
  const [paceOptions, setPaceOptions] = useState<PaceOption[]>([]);
  const [selectedPaceId, setSelectedPaceId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [latestPlan, setLatestPlan] = useState<PlanDetail | null>(null);
  const [assignmentGenerationStatus, setAssignmentGenerationStatus] =
    useState<BookAssignmentGenerationStatus | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreparingPaces, setIsPreparingPaces] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  const refreshAssignmentStatus = useCallback(
    async (bookIdValue: string, silent = false) => {
      try {
        const status = await getBookAssignmentGenerationStatus(bookIdValue);
        setAssignmentGenerationStatus(status);
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) {
          setAssignmentGenerationStatus(null);
          return;
        }

        if (!silent) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load assignment generation status.";
          toast.error(message);
        }
      }
    },
    [],
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

      let pacesPayload: PaceGenerationResponse;
      try {
        pacesPayload = await listPaceOptions(bookId);
      } catch (paceError: unknown) {
        if (isApiError(paceError) && paceError.status === 404) {
          pacesPayload = { bookId, options: [] };
        } else {
          throw paceError;
        }
      }

      setBook(bookData);
      setToc(tocData);
      setPaceOptions(pacesPayload.options);
      setLatestPlan(latestPlanData);
      setSelectedPaceId(
        latestPlanData?.paceOptionId ?? pacesPayload.options[0]?.id ?? null,
      );
      await refreshAssignmentStatus(bookId, true);

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
  }, [bookId, refreshAssignmentStatus]);

  useEffect(() => {
    void loadBookState();
  }, [loadBookState]);

  useEffect(() => {
    if (
      !bookId ||
      !assignmentGenerationStatus ||
      (assignmentGenerationStatus.status !== "PENDING" &&
        assignmentGenerationStatus.status !== "RUNNING")
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshAssignmentStatus(bookId, true);
    }, 9000);

    return () => {
      window.clearInterval(timer);
    };
  }, [assignmentGenerationStatus, bookId, refreshAssignmentStatus]);

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

    if (latestPlan) {
      toast.info("A plan already exists for this book.");
      return;
    }

    if (!selectedPaceId) {
      toast.error("Select a pace option first.");
      return;
    }

    setIsCreatingPlan(true);
    try {
      const created = await createPlan(bookId, {
        paceOptionId: selectedPaceId,
        startDate,
      });

      setLatestPlan(created);
      setSelectedPaceId(created.paceOptionId);
      toast.success("Plan created.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create plan.";
      toast.error(message);
    } finally {
      setIsCreatingPlan(false);
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
            <Badge variant="secondary">#{book.id}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="toc" className="space-y-4">
        <TabsList>
          <TabsTrigger value="toc">Table of Contents</TabsTrigger>
          <TabsTrigger value="pace">Pace and Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="toc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ToC Tree</CardTitle>
            </CardHeader>
            <CardContent>
              {toc && toc.nodes.length > 0 ? (
                <TocTree nodes={toc.nodes} linkToNodes bookId={bookId ?? undefined} />
              ) : (
                <EmptyState
                  title="No ToC found"
                  description="This book has no parsed table of contents."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!assignmentGenerationStatus ? (
                <p className="text-sm text-muted-foreground">
                  Assignment generation status is unavailable for this book.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary">{assignmentGenerationStatus.status}</Badge>
                    <span className="text-muted-foreground">
                      {assignmentGenerationStatus.generatedSections} /{" "}
                      {assignmentGenerationStatus.totalSections} sections generated
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-foreground/70 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          assignmentGenerationStatus.totalSections > 0
                            ? Math.round(
                                (assignmentGenerationStatus.generatedSections /
                                  assignmentGenerationStatus.totalSections) *
                                  100,
                              )
                            : 100,
                        )}%`,
                      }}
                    />
                  </div>

                  {assignmentGenerationStatus.failedSections > 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {assignmentGenerationStatus.failedSections} section(s) are currently
                      failed and queued for retry.
                    </p>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    Updated {formatDateTime(assignmentGenerationStatus.updatedAt)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pace Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestPlan ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">Plan already created</p>
                  <p className="text-muted-foreground">
                    Selected pace: {latestPlan.paceOption.name}
                  </p>
                </div>
              ) : null}

              {paceOptions.length === 0 ? (
                <EmptyState
                  title="No pace options yet"
                  description="Prepare default pace options for this textbook."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void onPreparePaces()}
                      disabled={isPreparingPaces || latestPlan !== null}
                    >
                      {isPreparingPaces ? "Preparing..." : "Prepare Pace Options"}
                    </Button>
                  }
                />
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
                          {option.sessionsPerWeek} sessions/week •{" "}
                          {option.minutesPerSession} min/session
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="pace-option"
                        checked={selectedPaceId === option.id}
                        onChange={() => setSelectedPaceId(option.id)}
                        disabled={latestPlan !== null}
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
                      onChange={(event) => setStartDate(event.target.value)}
                      disabled={latestPlan !== null}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={() => void onCreatePlan()}
                  disabled={isCreatingPlan || !selectedPaceId || latestPlan !== null}
                >
                  {latestPlan
                    ? "Plan Locked"
                    : isCreatingPlan
                      ? "Creating..."
                      : "Create Plan"}
                </Button>

                {latestPlan ? (
                  <Button asChild variant="secondary">
                    <Link href={`/plans/${latestPlan.id}`}>Open Plan #{latestPlan.id}</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
