"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { BookWorkspaceNav } from "@/components/navigation/book-workspace-nav";
import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getLatestMaterial,
  getMaterialSession,
  getTocNode,
  saveMaterialResponses,
  startMaterialSession,
  submitMaterialSession,
} from "@/lib/api/endpoints";
import type {
  LatestMaterialResult,
  MaterialPendingState,
  MaterialResponseInput,
  MaterialSession,
  MaterialType,
  PlanItemType,
  TocNodeDetail,
} from "@/lib/api/models";
import { formatDateTime } from "@/lib/utils/date";
import { writeLastOpenedNode } from "@/lib/utils/resume";
import { parseOptionalUuid, parseRequiredUuid } from "@/lib/utils/uuid";

type MaterialDraft = {
  selectedOptionIndex?: number;
  answerText?: string;
};

type DraftMap = Record<string, MaterialDraft>;

const DRAFT_STORAGE_PREFIX = "textbooked.materialDrafts";
const PENDING_POLL_INTERVAL_MS = 9000;
const GRADING_POLL_INTERVAL_MS = 6000;

export default function TocNodePage() {
  const params = useParams<{ nodeId: string }>();
  const searchParams = useSearchParams();
  const nodeId = useMemo(() => parseRequiredUuid(params.nodeId), [params.nodeId]);
  const bookIdFromQuery = useMemo(() => {
    return parseOptionalUuid(searchParams.get("bookId"));
  }, [searchParams]);
  const planIdFromQuery = useMemo(() => {
    return parseOptionalUuid(searchParams.get("planId"));
  }, [searchParams]);
  const activity = useMemo<PlanItemType>(
    () => parseActivity(searchParams.get("activity")),
    [searchParams],
  );
  const materialType = useMemo<MaterialType | null>(
    () => mapActivityToMaterialType(activity),
    [activity],
  );

  const [nodeDetail, setNodeDetail] = useState<TocNodeDetail | null>(null);
  const [materialResult, setMaterialResult] = useState<LatestMaterialResult | null>(null);
  const [session, setSession] = useState<MaterialSession | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isSavingResponses, setIsSavingResponses] = useState(false);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const draftStorageKey = useMemo(() => {
    if (!nodeId) {
      return null;
    }

    return `${DRAFT_STORAGE_PREFIX}.${nodeId}.${activity}`;
  }, [activity, nodeId]);

  const savedDraftSignatureRef = useRef<string>("");

  const loadPage = useCallback(async () => {
    if (!nodeId) {
      setError("Invalid ToC node id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const node = await getTocNode(nodeId, bookIdFromQuery ?? undefined);
      setNodeDetail(node);

      if (!materialType) {
        setMaterialResult(null);
        setSession(null);
        return;
      }

      const latest = await getLatestMaterial(nodeId, materialType);
      setMaterialResult(latest);

      if (latest.state === "ready") {
        hydrateSession(latest.material.latestSession);
      } else {
        setSession(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load section.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookIdFromQuery, materialType, nodeId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!nodeDetail) {
      return;
    }

    writeLastOpenedNode(nodeDetail.book.id, nodeDetail.node.id, planIdFromQuery);
  }, [nodeDetail, planIdFromQuery]);

  useEffect(() => {
    if (!draftStorageKey) {
      return;
    }

    const loadedDrafts = readDrafts(draftStorageKey);
    setDrafts(loadedDrafts);
    savedDraftSignatureRef.current = serializeDrafts(loadedDrafts);
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftStorageKey) {
      return;
    }

    writeDrafts(draftStorageKey, drafts);
  }, [draftStorageKey, drafts]);

  useEffect(() => {
    if (!nodeId || !materialType || materialResult?.state !== "pending") {
      return;
    }

    const pending = materialResult.pending;
    const progress = pending.materialsGeneration.byType[materialType];
    const generationActive =
      pending.materialsGeneration.status === "PENDING" ||
      pending.materialsGeneration.status === "RUNNING";
    const sectionActive =
      pending.sectionStatus === "PENDING" ||
      pending.sectionStatus === "RUNNING" ||
      (pending.sectionStatus === "FAILED" && Boolean(pending.nextRetryAt));

    if (!generationActive || !sectionActive || progress.totalSections === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const latest = await getLatestMaterial(nodeId, materialType);
          setMaterialResult(latest);

          if (latest.state === "ready") {
            hydrateSession(latest.material.latestSession);
            toast.success(`${materialType} is ready.`);
          }
        } catch {
          // keep polling
        }
      })();
    }, PENDING_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [materialResult, materialType, nodeId]);

  useEffect(() => {
    if (!session || session.status !== "GRADING") {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const updated = await getMaterialSession(session.id);
          setSession(updated);

          if (updated.status === "GRADED" || updated.status === "EXPIRED_AUTO_SUBMITTED") {
            toast.success("Final grading is ready.");
          }
        } catch {
          // keep polling
        }
      })();
    }, GRADING_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [session]);

  useEffect(() => {
    if (!session?.expiresAt || session.status !== "IN_PROGRESS") {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session?.expiresAt, session?.status]);

  const persistResponses = useCallback(
    async (showToast = false): Promise<MaterialSession | null> => {
      if (!session || session.status !== "IN_PROGRESS") {
        return null;
      }

      const payload = buildResponsePayload(drafts);
      if (payload.length === 0) {
        return null;
      }

      const signature = serializeDrafts(drafts);
      if (signature === savedDraftSignatureRef.current) {
        return null;
      }

      setIsSavingResponses(true);

      try {
        const updated = await saveMaterialResponses(session.id, payload);
        setSession(updated);
        savedDraftSignatureRef.current = signature;
        if (showToast) {
          toast.success("Responses saved.");
        }
        return updated;
      } catch (err: unknown) {
        if (showToast) {
          const message = err instanceof Error ? err.message : "Failed to save responses.";
          toast.error(message);
        }
        return null;
      } finally {
        setIsSavingResponses(false);
      }
    },
    [drafts, session],
  );

  useEffect(() => {
    if (!session || session.status !== "IN_PROGRESS") {
      return;
    }

    const signature = serializeDrafts(drafts);
    if (signature === savedDraftSignatureRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistResponses(false);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [drafts, persistResponses, session]);

  async function onStartSession() {
    if (materialResult?.state !== "ready") {
      return;
    }

    setIsStartingSession(true);

    try {
      const started = await startMaterialSession(materialResult.material.id);
      hydrateSession(started);
      toast.success("Session started.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start session.";
      toast.error(message);
    } finally {
      setIsStartingSession(false);
    }
  }

  async function onSubmitSession() {
    if (!session || session.status !== "IN_PROGRESS") {
      return;
    }

    setIsSubmittingSession(true);

    try {
      await persistResponses(false);
      const submitted = await submitMaterialSession(session.id);
      setSession(submitted);

      if (submitted.status === "GRADING") {
        toast.info("Submitted. Final grading is in progress.");
      } else {
        toast.success("Submitted.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit session.";
      toast.error(message);
    } finally {
      setIsSubmittingSession(false);
    }
  }

  function hydrateSession(nextSession: MaterialSession | null) {
    setSession(nextSession);

    if (!nextSession) {
      return;
    }

    const nextDrafts = Object.fromEntries(
      nextSession.responses.map((response) => [
        response.questionId,
        {
          selectedOptionIndex: response.selectedOptionIndex ?? undefined,
          answerText: response.answerText ?? "",
        },
      ]),
    ) satisfies DraftMap;

    setDrafts((current) => {
      const merged = {
        ...current,
        ...nextDrafts,
      };
      savedDraftSignatureRef.current = serializeDrafts(merged);
      return merged;
    });
  }

  if (isLoading) {
    return <LoadingState label="Loading section..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        message={error}
        action={
          <Button type="button" variant="outline" onClick={() => void loadPage()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!nodeDetail) {
    return <ErrorAlert message="Section was not found." />;
  }

  const breadcrumbNodes = [...nodeDetail.parents, { id: nodeDetail.node.id, title: nodeDetail.node.title }];
  const breadcrumbHref = (targetNodeId: string) =>
    buildTocHref(targetNodeId, nodeDetail.book.id, planIdFromQuery, activity);
  const playerHref = buildTocHref(nodeDetail.node.id, nodeDetail.book.id, planIdFromQuery, activity);
  const tocHref = `/books/${nodeDetail.book.id}?tab=toc`;
  const paceHref = `/books/${nodeDetail.book.id}?tab=pace`;
  const planHref = planIdFromQuery ? `/plans/${planIdFromQuery}` : undefined;

  const material = materialResult?.state === "ready" ? materialResult.material : null;
  const pending = materialResult?.state === "pending" ? materialResult.pending : null;
  const sessionExpired =
    session?.expiresAt && session.status === "IN_PROGRESS"
      ? new Date(session.expiresAt).getTime() <= nowMs
      : false;
  const canInteract =
    session !== null && session.status === "IN_PROGRESS" && !sessionExpired;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/books/${nodeDetail.book.id}?tab=toc`}>
              <ArrowLeft className="size-4" />
              Back to Book
            </Link>
          </Button>
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href={`/books/${nodeDetail.book.id}?tab=toc`} className="hover:underline">
            {nodeDetail.book.title}
          </Link>
          {breadcrumbNodes.map((crumb, index) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <span>/</span>
              {index === breadcrumbNodes.length - 1 ? (
                <span className="font-medium text-foreground">{crumb.title}</span>
              ) : (
                <Link href={breadcrumbHref(crumb.id)} className="hover:underline">
                  {crumb.title}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <h1 className="text-2xl font-semibold tracking-tight">{nodeDetail.node.title}</h1>
      </div>

      <BookWorkspaceNav
        playerHref={playerHref}
        tocHref={tocHref}
        paceHref={paceHref}
        planHref={planHref}
        active="player"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{activityLabel(activity)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={activity === "READ" ? "default" : "outline"} size="sm">
              <Link href={buildTocHref(nodeDetail.node.id, nodeDetail.book.id, planIdFromQuery, "READ")}>Read</Link>
            </Button>
            <Button
              asChild
              variant={activity === "ASSIGNMENT" ? "default" : "outline"}
              size="sm"
            >
              <Link href={buildTocHref(nodeDetail.node.id, nodeDetail.book.id, planIdFromQuery, "ASSIGNMENT")}>
                Assignment
              </Link>
            </Button>
            <Button asChild variant={activity === "REVIEW" ? "default" : "outline"} size="sm">
              <Link href={buildTocHref(nodeDetail.node.id, nodeDetail.book.id, planIdFromQuery, "REVIEW")}>Review</Link>
            </Button>
            <Button asChild variant={activity === "TEST" ? "default" : "outline"} size="sm">
              <Link href={buildTocHref(nodeDetail.node.id, nodeDetail.book.id, planIdFromQuery, "TEST")}>Test</Link>
            </Button>
          </div>

          {activity === "READ" ? (
            <ReadPanel />
          ) : pending ? (
            <PendingMaterialPanel pending={pending} materialType={materialType} />
          ) : material ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{material.type}</Badge>
                <Badge variant="outline">{material.questionCount} questions</Badge>
                {material.durationSeconds ? (
                  <Badge variant="outline">
                    {Math.round(material.durationSeconds / 60)} min timed
                  </Badge>
                ) : null}
                <span>Generated {formatDateTime(material.createdAt)}</span>
              </div>

              {session ? (
                <SessionStatusPanel
                  session={session}
                  expired={sessionExpired}
                  nowMs={nowMs}
                />
              ) : (
                <EmptyState
                  title="No active session"
                  description="Start to answer this section's material."
                  action={
                    <Button
                      type="button"
                      onClick={() => void onStartSession()}
                      disabled={isStartingSession}
                    >
                      {isStartingSession ? "Starting..." : "Start"}
                    </Button>
                  }
                />
              )}

              {session && session.status !== "IN_PROGRESS" && material.type !== "TEST" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onStartSession()}
                  disabled={isStartingSession}
                >
                  {isStartingSession ? "Starting..." : "Start New Attempt"}
                </Button>
              ) : null}

              {material.questions.length > 0 && session ? (
                <div className="space-y-4">
                  {material.questions.map((question, questionIndex) => {
                    const currentDraft = drafts[question.id] ?? {};

                    return (
                      <Card key={question.id}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Question {questionIndex + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">{question.prompt}</p>

                          {question.format === "MCQ" ? (
                            <div className="space-y-2">
                              {(question.options ?? []).map((option, index) => {
                                const selected = currentDraft.selectedOptionIndex === index;
                                return (
                                  <button
                                    key={`${question.id}-${index}`}
                                    type="button"
                                    disabled={!canInteract}
                                    onClick={() =>
                                      setDrafts((current) => ({
                                        ...current,
                                        [question.id]: {
                                          ...current[question.id],
                                          selectedOptionIndex: index,
                                        },
                                      }))
                                    }
                                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                                      selected
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:bg-muted/40"
                                    } ${!canInteract ? "cursor-not-allowed opacity-70" : ""}`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <Textarea
                              value={currentDraft.answerText ?? ""}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [question.id]: {
                                    ...current[question.id],
                                    answerText: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Write your answer..."
                              rows={4}
                              disabled={!canInteract}
                            />
                          )}

                          {renderResponseFeedback(session, question.id)}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : null}

              {session && session.status === "IN_PROGRESS" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void persistResponses(true)}
                    disabled={isSavingResponses || !canInteract}
                  >
                    {isSavingResponses ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void onSubmitSession()}
                    disabled={isSubmittingSession || !canInteract}
                  >
                    {isSubmittingSession ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="Material unavailable"
              description="This activity has no generated material yet."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function PendingMaterialPanel({
  pending,
  materialType,
}: {
  pending: MaterialPendingState;
  materialType: MaterialType | null;
}) {
  if (!materialType) {
    return null;
  }

  const progress = pending.materialsGeneration.byType[materialType];

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{pending.sectionStatus}</Badge>
          <Badge variant="secondary">{pending.materialsGeneration.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{pending.message}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {progress.generatedSections} / {progress.totalSections} {materialType.toLowerCase()} sections generated
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-foreground/70 transition-all"
            style={{
              width: `${Math.min(
                100,
                progress.totalSections > 0
                  ? Math.round((progress.generatedSections / progress.totalSections) * 100)
                  : 100,
              )}%`,
            }}
          />
        </div>
      </div>

      {pending.nextRetryAt ? (
        <p className="text-xs text-muted-foreground">
          Next retry: {formatDateTime(pending.nextRetryAt)}
        </p>
      ) : null}
    </div>
  );
}

function ReadPanel() {
  return (
    <div className="rounded-md border p-4 text-sm text-muted-foreground">
      <p>
        Read this section first, then continue with assignment, review, or test from the buttons above.
      </p>
    </div>
  );
}

function SessionStatusPanel({
  session,
  expired,
  nowMs,
}: {
  session: MaterialSession;
  expired: boolean;
  nowMs: number;
}) {
  const remainingMs =
    session.expiresAt && session.status === "IN_PROGRESS"
      ? Math.max(0, new Date(session.expiresAt).getTime() - nowMs)
      : null;

  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{session.status}</Badge>
        {session.scorePercent !== null ? (
          <Badge variant="secondary" className={scoreToneClassName(session.scorePercent)}>
            Score {session.scorePercent}%
          </Badge>
        ) : null}
        {typeof session.passed === "boolean" ? (
          <Badge variant={session.passed ? "secondary" : "outline"}>
            {session.passed ? "Passed" : "Not passed"}
          </Badge>
        ) : null}
      </div>

      {session.expiresAt ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          {expired
            ? "Time is up. The session will auto-submit."
            : `Time remaining: ${formatRemainingDuration(remainingMs ?? 0)}`}
        </div>
      ) : null}

      {session.gradedAt ? (
        <p className="text-xs text-muted-foreground">Graded {formatDateTime(session.gradedAt)}</p>
      ) : null}
    </div>
  );
}

function renderResponseFeedback(session: MaterialSession, questionId: string) {
  const response = session.responses.find((candidate) => candidate.questionId === questionId);
  if (!response || !response.feedback) {
    return null;
  }

  const feedback = response.feedback as Record<string, unknown>;
  const correctness =
    typeof feedback.correctness === "string" ? feedback.correctness : null;
  const misses = Array.isArray(feedback.misses)
    ? feedback.misses.map((value) => String(value)).filter((value) => value.length > 0)
    : [];

  return (
    <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
      {correctness ? <p>Result: {correctness}</p> : null}
      {response.scoreRaw !== null && response.maxRaw !== null ? (
        <p>
          Question score: {response.scoreRaw}/{response.maxRaw}
        </p>
      ) : null}
      {misses.length > 0 ? <p>Misses: {misses.join("; ")}</p> : null}
    </div>
  );
}

function parseActivity(value: string | null): PlanItemType {
  switch (value) {
    case "READ":
    case "ASSIGNMENT":
    case "REVIEW":
    case "TEST":
      return value;
    default:
      return "ASSIGNMENT";
  }
}

function mapActivityToMaterialType(activity: PlanItemType): MaterialType | null {
  switch (activity) {
    case "ASSIGNMENT":
    case "REVIEW":
    case "TEST":
      return activity;
    default:
      return null;
  }
}

function activityLabel(activity: PlanItemType): string {
  if (activity === "READ") {
    return "Read";
  }

  if (activity === "ASSIGNMENT") {
    return "Assignment";
  }

  if (activity === "REVIEW") {
    return "Review";
  }

  return "Timed Test";
}

function buildTocHref(
  nodeId: string,
  bookId: string,
  planId?: string | null,
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

function buildResponsePayload(drafts: DraftMap): MaterialResponseInput[] {
  return Object.entries(drafts)
    .map(([questionId, draft]) => {
      const payload: MaterialResponseInput = {
        questionId,
      };

      if (typeof draft.selectedOptionIndex === "number") {
        payload.selectedOptionIndex = draft.selectedOptionIndex;
      }

      if (typeof draft.answerText === "string") {
        payload.answerText = draft.answerText;
      }

      return payload;
    })
    .filter((payload) => {
      return (
        typeof payload.selectedOptionIndex === "number" ||
        (typeof payload.answerText === "string" && payload.answerText.trim().length > 0)
      );
    });
}

function readDrafts(storageKey: string): DraftMap {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([questionId, value]) => {
          if (typeof questionId !== "string" || !value || typeof value !== "object") {
            return false;
          }

          const candidate = value as MaterialDraft;
          const hasMcq = typeof candidate.selectedOptionIndex === "number";
          const hasWritten = typeof candidate.answerText === "string";
          return hasMcq || hasWritten;
        })
        .map(([questionId, value]) => {
          const candidate = value as MaterialDraft;
          return [questionId, candidate] as const;
        }),
    );
  } catch {
    return {};
  }
}

function writeDrafts(storageKey: string, drafts: DraftMap): void {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(drafts).length === 0) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(drafts));
}

function serializeDrafts(drafts: DraftMap): string {
  const entries = Object.entries(drafts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([questionId, draft]) => [
      questionId,
      {
        selectedOptionIndex:
          typeof draft.selectedOptionIndex === "number"
            ? draft.selectedOptionIndex
            : null,
        answerText: typeof draft.answerText === "string" ? draft.answerText : "",
      },
    ]);

  return JSON.stringify(entries);
}

function scoreToneClassName(scorePercent: number): string | undefined {
  if (scorePercent < 50) {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  }

  if (scorePercent < 70) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  }

  return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
}

function formatRemainingDuration(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
