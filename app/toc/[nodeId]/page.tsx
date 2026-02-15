"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  createAttempt,
  getLatestAssignment,
  getTocNode,
  gradeAttempt,
  listAttempts,
} from "@/lib/api/endpoints";
import type {
  Assignment,
  Attempt,
  AttemptFeedback,
  LatestAssignmentResult,
  TocNodeDetail,
} from "@/lib/api/models";
import { formatDateTime } from "@/lib/utils/date";
import { parseOptionalUuid, parseRequiredUuid } from "@/lib/utils/uuid";

type AttemptsByQuestion = Record<string, Attempt[]>;

export default function TocNodePage() {
  const params = useParams<{ nodeId: string }>();
  const searchParams = useSearchParams();
  const nodeId = useMemo(() => parseRequiredUuid(params.nodeId), [params.nodeId]);
  const bookIdFromQuery = useMemo(() => {
    return parseOptionalUuid(searchParams.get("bookId"));
  }, [searchParams]);

  const [nodeDetail, setNodeDetail] = useState<TocNodeDetail | null>(null);
  const [assignmentResult, setAssignmentResult] = useState<LatestAssignmentResult | null>(
    null,
  );
  const [attemptsByQuestion, setAttemptsByQuestion] = useState<AttemptsByQuestion>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string | null>(null);
  const [gradingAttemptId, setGradingAttemptId] = useState<string | null>(null);

  const hydrateAttempts = useCallback(async (questions: Assignment["questions"]) => {
    const entries = await Promise.all(
      questions.map(async (question) => {
        try {
          const attempts = await listAttempts(question.id);
          return [question.id, attempts] as const;
        } catch {
          return [question.id, []] as const;
        }
      }),
    );

    setAttemptsByQuestion(Object.fromEntries(entries));
  }, []);

  const loadPage = useCallback(async () => {
    if (!nodeId) {
      setError("Invalid ToC node id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [node, latestAssignment] = await Promise.all([
        getTocNode(nodeId, bookIdFromQuery ?? undefined),
        getLatestAssignment(nodeId),
      ]);

      setNodeDetail(node);
      setAssignmentResult(latestAssignment);

      if (latestAssignment.state === "ready") {
        await hydrateAttempts(latestAssignment.assignment.questions);
      } else {
        setAttemptsByQuestion({});
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load ToC node.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookIdFromQuery, hydrateAttempts, nodeId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!nodeId || assignmentResult?.state !== "pending") {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const latest = await getLatestAssignment(nodeId);
          setAssignmentResult((current) => {
            if (current?.state === "pending" && latest.state === "ready") {
              toast.success("Section assignment is ready.");
            }

            return latest;
          });

          if (latest.state === "ready") {
            await hydrateAttempts(latest.assignment.questions);
          }
        } catch {
          // Keep the current state and retry in the next poll tick.
        }
      })();
    }, 9000);

    return () => {
      window.clearInterval(timer);
    };
  }, [assignmentResult, hydrateAttempts, nodeId]);

  async function onSubmitAnswer(questionId: string) {
    const answerText = answers[questionId]?.trim() ?? "";
    if (!answerText) {
      toast.error("Write an answer before submitting.");
      return;
    }

    setSubmittingQuestionId(questionId);

    try {
      await createAttempt(questionId, answerText);
      const attempts = await listAttempts(questionId);
      setAttemptsByQuestion((current) => ({
        ...current,
        [questionId]: attempts,
      }));
      setAnswers((current) => ({ ...current, [questionId]: "" }));
      toast.success("Answer submitted.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit answer.";
      toast.error(message);
    } finally {
      setSubmittingQuestionId(null);
    }
  }

  async function onGrade(questionId: string, attemptId: string) {
    setGradingAttemptId(attemptId);

    try {
      await gradeAttempt(attemptId);
      const attempts = await listAttempts(questionId);
      setAttemptsByQuestion((current) => ({
        ...current,
        [questionId]: attempts,
      }));
      toast.success("Attempt graded.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to grade attempt.";
      toast.error(message);
    } finally {
      setGradingAttemptId(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading ToC node..." />;
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
    return <ErrorAlert message="ToC node not found." />;
  }

  const breadcrumbNodes = [
    ...nodeDetail.parents,
    { id: nodeDetail.node.id, title: nodeDetail.node.title },
  ];
  const breadcrumbHref = (targetNodeId: string) =>
    `/toc/${targetNodeId}?bookId=${nodeDetail.book.id}`;
  const assignment = assignmentResult?.state === "ready" ? assignmentResult.assignment : null;
  const pendingAssignment =
    assignmentResult?.state === "pending" ? assignmentResult.pending : null;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/books/${nodeDetail.book.id}`}>
              <ArrowLeft className="size-4" />
              Back to Book
            </Link>
          </Button>
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href={`/books/${nodeDetail.book.id}`} className="hover:underline">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!assignmentResult ? (
            <EmptyState
              title="Assignment unavailable"
              description="Assignment state is unavailable for this section."
            />
          ) : pendingAssignment ? (
            <div className="space-y-4 rounded-md border p-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{pendingAssignment.sectionStatus}</Badge>
                  <Badge variant="secondary">
                    {pendingAssignment.assignmentGeneration.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{pendingAssignment.message}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Generated {pendingAssignment.assignmentGeneration.generatedSections} /{" "}
                  {pendingAssignment.assignmentGeneration.totalSections} sections
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-foreground/70 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        pendingAssignment.assignmentGeneration.totalSections > 0
                          ? Math.round(
                              (pendingAssignment.assignmentGeneration.generatedSections /
                                pendingAssignment.assignmentGeneration.totalSections) *
                                100,
                            )
                          : 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {pendingAssignment.assignmentGeneration.failedSections > 0 ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {pendingAssignment.assignmentGeneration.failedSections} section(s) are
                  currently in failed state and retrying.
                </p>
              ) : null}

              {pendingAssignment.nextRetryAt ? (
                <p className="text-xs text-muted-foreground">
                  Next retry: {formatDateTime(pendingAssignment.nextRetryAt)}
                </p>
              ) : null}
            </div>
          ) : assignment ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{assignment.questions.length} questions</Badge>
                <span>Generated {formatDateTime(assignment.createdAt)}</span>
              </div>

              <div className="space-y-4">
                {assignment.questions.map((question) => {
                  const attempts = attemptsByQuestion[question.id] ?? [];

                  return (
                    <Card key={question.id}>
                      <CardHeader>
                        <CardTitle className="text-base">Question {question.id}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm">{question.prompt}</p>

                        {renderRubric(question.rubric)}

                        <div className="space-y-2">
                          <Textarea
                            value={answers[question.id] ?? ""}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: event.target.value,
                              }))
                            }
                            placeholder="Write your answer..."
                            rows={4}
                          />

                          <Button
                            type="button"
                            disabled={submittingQuestionId === question.id}
                            onClick={() => void onSubmitAnswer(question.id)}
                          >
                            {submittingQuestionId === question.id
                              ? "Submitting..."
                              : "Submit Answer"}
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-medium">Attempt History</p>

                          {attempts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No attempts yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {attempts.map((attempt) => {
                                const feedback = readFeedback(attempt);
                                return (
                                  <div key={attempt.id} className="rounded-md border p-3 text-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">Attempt #{attempt.id}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDateTime(attempt.createdAt)}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">
                                          Score: {attempt.score ?? "Not graded"}
                                        </Badge>

                                        {attempt.score === null ? (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={gradingAttemptId === attempt.id}
                                            onClick={() => void onGrade(question.id, attempt.id)}
                                          >
                                            {gradingAttemptId === attempt.id
                                              ? "Grading..."
                                              : "Grade"}
                                          </Button>
                                        ) : null}
                                      </div>
                                    </div>

                                    {feedback ? (
                                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                                        {feedback.hits && feedback.hits.length > 0 ? (
                                          <p>
                                            <span className="font-medium text-foreground">Hits:</span>{" "}
                                            {feedback.hits.join("; ")}
                                          </p>
                                        ) : null}

                                        {feedback.misses && feedback.misses.length > 0 ? (
                                          <p>
                                            <span className="font-medium text-foreground">Misses:</span>{" "}
                                            {feedback.misses.join("; ")}
                                          </p>
                                        ) : null}

                                        {feedback.followupProbe ? (
                                          <p>
                                            <span className="font-medium text-foreground">
                                              Follow-up:
                                            </span>{" "}
                                            {feedback.followupProbe}
                                          </p>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Assignment unavailable"
              description="Assignment state is unavailable for this section."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function renderRubric(rubric: unknown) {
  const bullets = readRubricBullets(rubric);
  if (bullets.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
      <p className="mb-2 text-foreground">Rubric</p>
      <ul className="list-disc space-y-1 pl-4">
        {bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function readRubricBullets(rubric: unknown): string[] {
  if (Array.isArray(rubric)) {
    return rubric.map((entry) => String(entry));
  }

  if (rubric && typeof rubric === "object") {
    const record = rubric as Record<string, unknown>;
    if (Array.isArray(record.bullets)) {
      return record.bullets.map((entry) => String(entry));
    }
  }

  return [];
}

function readFeedback(attempt: Attempt): AttemptFeedback | null {
  if (attempt.feedback && typeof attempt.feedback === "object") {
    return attempt.feedback;
  }

  if (attempt.feedbackJson) {
    try {
      const parsed = JSON.parse(attempt.feedbackJson) as AttemptFeedback;
      return parsed;
    } catch {
      return null;
    }
  }

  return null;
}
