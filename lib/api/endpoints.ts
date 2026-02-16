import {
  assignmentsControllerGetLatest,
  attemptsControllerCreate,
  attemptsControllerGrade,
  booksControllerCreate,
  booksControllerGetById,
  pacesControllerGenerate,
  plansControllerCreate,
  plansControllerGetById,
  tocControllerGetByBook,
  tocControllerUpload,
} from "@/lib/api/generated/textbooked";
import { apiFetch } from "@/lib/api/api-fetch";
import type {
  Assignment,
  AssignmentPendingState,
  Attempt,
  BookAssignmentGenerationStatus,
  BookEnrollmentResult,
  BookIntakeAnalyzeResult,
  BookIntakeFinalizeInput,
  BookIntakeFinalizeResult,
  BookDetail,
  BookMaterialsGenerationStatus,
  BookOverviewPayload,
  BookOverviewSummary,
  BookProgressPayload,
  BookProgressSummary,
  BookSummary,
  LibraryBookRow,
  LatestAssignmentResult,
  LatestMaterialResult,
  MaterialResponseInput,
  MaterialPendingState,
  MaterialSession,
  MaterialSet,
  MaterialType,
  OverviewMetricPayload,
  PaceGenerationResponse,
  PlanDetail,
  PlanItem,
  PlanItemStatus,
  TocNodeDetail,
  TocTreeNode,
  TocTreeResponse,
} from "@/lib/api/models";
import { ApiError, isApiError } from "@/lib/api/request";
import { isUuid } from "@/lib/utils/uuid";

type ApiEnvelope<T> = {
  data: T;
  status: number;
  headers: Headers;
};

const KNOWN_BOOK_IDS_STORAGE_KEY = "textbooked.knownBookIds";
const attemptsByQuestion = new Map<string, Attempt[]>();
const questionIdByAttemptId = new Map<string, string>();

function getData<T>(response: unknown): T {
  return (response as ApiEnvelope<T>).data;
}

export type LibraryBooksWithProgressResult = {
  books: LibraryBookRow[];
  missingProgressEndpoint: boolean;
};

export async function listBooks(): Promise<BookSummary[]> {
  try {
    const response = await apiFetch<ApiEnvelope<BookSummary[]>>("/books", {
      method: "GET",
    });

    rememberBookIds(response.data.map((book) => book.id));

    return response.data;
  } catch (error: unknown) {
    if (!(isApiError(error) && error.status === 404)) {
      throw error;
    }

    const fallbackBookIds = getRememberedBookIds();
    if (fallbackBookIds.length === 0) {
      return [];
    }

    const recoveredBooks = await Promise.all(
      fallbackBookIds.map(async (bookId) => {
        try {
          return await getBook(bookId);
        } catch {
          return null;
        }
      }),
    );

    return recoveredBooks
      .filter((book): book is BookDetail => Boolean(book))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function getBookProgress(bookId: string): Promise<BookProgressSummary> {
  const response = await apiFetch<ApiEnvelope<BookProgressPayload>>(
    `/books/${bookId}/progress`,
    {
      method: "GET",
    },
  );

  return normalizeBookProgress(response.data);
}

export async function getBookAssignmentGenerationStatus(
  bookId: string,
): Promise<BookAssignmentGenerationStatus> {
  const response = await apiFetch<ApiEnvelope<BookAssignmentGenerationStatus>>(
    `/books/${bookId}/assignments/status`,
    {
      method: "GET",
    },
  );

  return response.data;
}

export async function getBookMaterialsGenerationStatus(
  bookId: string,
): Promise<BookMaterialsGenerationStatus> {
  const response = await apiFetch<ApiEnvelope<BookMaterialsGenerationStatus>>(
    `/books/${bookId}/materials/status`,
    {
      method: "GET",
    },
  );

  return response.data;
}

export async function listLibraryBooksWithProgress(): Promise<LibraryBooksWithProgressResult> {
  const books = await listBooks();
  const progressByBookId = new Map<string, BookProgressSummary>();
  const booksMissingProgress: BookSummary[] = [];

  for (const book of books) {
    const fromBookPayload = normalizeMaybeBookProgress(book.progress);

    if (fromBookPayload) {
      progressByBookId.set(book.id, fromBookPayload);
    } else {
      booksMissingProgress.push(book);
    }
  }

  let missingProgressEndpoint = false;

  if (booksMissingProgress.length > 0) {
    const [firstBook, ...remainingBooks] = booksMissingProgress;

    try {
      const firstProgress = await getBookProgress(firstBook.id);
      progressByBookId.set(firstBook.id, firstProgress);

      const remainingProgress = await Promise.all(
        remainingBooks.map(async (book) => {
          try {
            const progress = await getBookProgress(book.id);
            return [book.id, progress] as const;
          } catch (error: unknown) {
            if (isApiError(error) && error.status === 404) {
              missingProgressEndpoint = true;
            }

            return [book.id, defaultBookProgress()] as const;
          }
        }),
      );

      for (const [bookId, progress] of remainingProgress) {
        progressByBookId.set(bookId, progress);
      }
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 404) {
        missingProgressEndpoint = true;
      }

      for (const book of booksMissingProgress) {
        progressByBookId.set(book.id, defaultBookProgress());
      }
    }
  }

  const rows: LibraryBookRow[] = books.map((book) => ({
    ...book,
    progress:
      progressByBookId.get(book.id) ??
      normalizeMaybeBookProgress(book.progress) ??
      defaultBookProgress(),
  }));

  return {
    books: rows,
    missingProgressEndpoint,
  };
}

export async function createBook(input: {
  title: string;
  author: string;
  coverUrl?: string;
}): Promise<BookDetail> {
  const response = await booksControllerCreate({
    title: input.title,
    author: input.author,
    coverUrl: input.coverUrl || undefined,
  });

  const createdBook = getData<BookDetail>(response);
  rememberBookId(createdBook.id);

  return createdBook;
}

export async function enrollBook(bookId: string): Promise<BookEnrollmentResult> {
  const response = await apiFetch<ApiEnvelope<BookEnrollmentResult>>(
    `/books/${bookId}/enroll`,
    {
      method: "POST",
    },
  );

  rememberBookId(bookId);
  return response.data;
}

export async function analyzeBookIntake(
  file: File,
  tocStartPage: number,
  tocEndPage: number,
): Promise<BookIntakeAnalyzeResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tocStartPage", String(tocStartPage));
  formData.append("tocEndPage", String(tocEndPage));

  const response = await apiFetch<ApiEnvelope<BookIntakeAnalyzeResult>>(
    "/books/intake/analyze",
    {
      method: "POST",
      body: formData,
    },
  );

  return response.data;
}

export async function finalizeBookIntake(
  payload: BookIntakeFinalizeInput,
): Promise<BookIntakeFinalizeResult> {
  const response = await apiFetch<ApiEnvelope<BookIntakeFinalizeResult>>(
    "/books/intake/finalize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  rememberBookId(response.data.book.id);
  return response.data;
}

export async function getBook(bookId: string): Promise<BookDetail> {
  const response = await booksControllerGetById(bookId);
  const book = getData<BookDetail>(response);
  rememberBookId(book.id);

  return book;
}

export async function getBookToc(bookId: string): Promise<TocTreeResponse> {
  const response = await tocControllerGetByBook(bookId);
  return getData<TocTreeResponse>(response);
}

export async function uploadBookToc(
  bookId: string,
  tocText: string,
): Promise<TocTreeResponse> {
  const response = await tocControllerUpload(bookId, { tocText });
  return getData<TocTreeResponse>(response);
}

export async function listPaceOptions(
  bookId: string,
): Promise<PaceGenerationResponse> {
  const response = await apiFetch<ApiEnvelope<PaceGenerationResponse>>(
    `/books/${bookId}/paces`,
    {
      method: "GET",
    },
  );

  return response.data;
}

export async function generatePaces(
  bookId: string,
): Promise<PaceGenerationResponse> {
  const response = await pacesControllerGenerate(bookId);
  return getData<PaceGenerationResponse>(response);
}

export async function createPlan(
  bookId: string,
  input: { paceOptionId: string; startDate: string },
): Promise<PlanDetail> {
  const response = await plansControllerCreate(bookId, {
    paceOptionId: input.paceOptionId,
    startDate: input.startDate,
  });

  return getData<PlanDetail>(response);
}

export async function getPlan(planId: string): Promise<PlanDetail> {
  const response = await plansControllerGetById(planId);
  return getData<PlanDetail>(response);
}

export async function getLatestPlanForBook(
  bookId: string,
): Promise<PlanDetail | null> {
  try {
    const response = await apiFetch<ApiEnvelope<PlanDetail>>(
      `/books/${bookId}/plans/latest`,
      {
        method: "GET",
      },
    );

    return response.data;
  } catch (error: unknown) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function pickCurrentPlanItem(plan: PlanDetail | null): PlanItem | null {
  if (!plan || plan.planItems.length === 0) {
    return null;
  }

  const sorted = [...plan.planItems].sort(comparePlanItemByDateAsc);
  const nextTodo = sorted.find((item) => item.status === "TODO");
  if (nextTodo) {
    return nextTodo;
  }

  const doneItems = sorted.filter((item) => item.status === "DONE");
  if (doneItems.length > 0) {
    return doneItems.sort(comparePlanItemByDateDesc)[0] ?? null;
  }

  return sorted[0] ?? null;
}

export function deriveBookOverviewSummary(
  book: BookDetail,
  plan: PlanDetail | null,
): BookOverviewSummary {
  const progress = normalizeMaybeBookProgress(book.progress) ?? defaultBookProgress();
  const rawOverview = normalizeMaybeBookOverview(book.overview);
  const planItems = plan?.planItems ?? [];
  const planDoneCount = planItems.filter((item) => item.status === "DONE").length;
  const currentPlanItem = pickCurrentPlanItem(plan);
  const currentTitleFromPlan = currentPlanItem?.tocNode.title ?? null;

  const sectionsFromPlan = deriveSectionMetric(planItems);
  const assignmentsFromPlan = deriveTypeMetric(planItems, "ASSIGNMENT");
  const reviewsFromPlan = deriveTypeMetric(planItems, "REVIEW");
  const testsFromPlan = deriveTypeMetric(planItems, "TEST");

  const sections = resolveOverviewMetric(
    rawOverview?.sections,
    rawOverview?.completedSections,
    rawOverview?.totalSections,
    sectionsFromPlan.completed,
    sectionsFromPlan.total,
  );
  const assignments = resolveOverviewMetric(
    rawOverview?.assignments,
    rawOverview?.completedAssignments,
    rawOverview?.totalAssignments,
    assignmentsFromPlan.completed,
    assignmentsFromPlan.total,
  );
  const reviews = resolveOverviewMetric(
    rawOverview?.reviews,
    rawOverview?.completedReviews,
    rawOverview?.totalReviews,
    reviewsFromPlan.completed,
    reviewsFromPlan.total,
  );
  const tests = resolveOverviewMetric(
    rawOverview?.tests,
    rawOverview?.completedTests,
    rawOverview?.totalTests,
    testsFromPlan.completed,
    testsFromPlan.total,
  );
  const questions = resolveOptionalOverviewMetric(
    rawOverview?.questions,
    rawOverview?.completedQuestions,
    rawOverview?.totalQuestions,
  );
  const fallbackOverallPercent =
    planItems.length > 0 ? Math.round((planDoneCount / planItems.length) * 100) : 0;
  const overallPercent = clampPercent(
    typeof rawOverview?.overallPercent === "number"
      ? rawOverview.overallPercent
      : progress.percentComplete > 0 || progress.totalItems > 0
        ? progress.percentComplete
        : fallbackOverallPercent,
  );
  const currentChapterOrSection =
    firstNonEmptyString([
      rawOverview?.currentChapterOrSection,
      rawOverview?.currentNodeTitle,
      progress.currentChapterOrSection,
      currentTitleFromPlan,
    ]) ?? "Not started yet";

  return {
    overallPercent,
    sections,
    assignments,
    reviews,
    tests,
    questions,
    currentChapterOrSection,
  };
}

export async function updatePlanItemStatus(
  planItemId: string,
  status: PlanItemStatus,
): Promise<PlanItem> {
  const response = await apiFetch<ApiEnvelope<PlanItem>>(
    `/plan-items/${planItemId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  return response.data;
}

export async function getTocNode(
  nodeId: string,
  bookId?: string,
): Promise<TocNodeDetail> {
  try {
    const response = await apiFetch<ApiEnvelope<unknown>>(`/toc/${nodeId}`, {
      method: "GET",
    });

    return normalizeTocNodeDetailResponse(response.data, nodeId, bookId);
  } catch (error: unknown) {
    if (!(isApiError(error) && error.status === 404)) {
      throw error;
    }

    if (!bookId || !isUuid(bookId)) {
      throw new ApiError(
        "This backend does not expose GET /toc/:nodeId. Open this node from a book/plan link so bookId is known.",
        404,
      );
    }

    const [tocTree, book] = await Promise.all([getBookToc(bookId), getBook(bookId)]);
    const locatedNode = findNodeWithParents(tocTree.nodes, nodeId, []);

    if (!locatedNode) {
      throw new ApiError(
        `ToC node ${nodeId} was not found in book ${bookId}.`,
        404,
      );
    }

    return {
      node: {
        id: locatedNode.node.id,
        parentId: locatedNode.node.parentId,
        title: locatedNode.node.title,
        order: locatedNode.node.order,
        depth: locatedNode.node.depth,
      },
      parents: locatedNode.parents.map((parent) => ({
        id: parent.id,
        title: parent.title,
      })),
      book: {
        id: book.id,
        title: book.title,
      },
    };
  }
}

function normalizeTocNodeDetailResponse(
  payload: unknown,
  requestedNodeId: string,
  hintedBookId?: string,
): TocNodeDetail {
  if (isTocNodeDetail(payload)) {
    return {
      ...payload,
      parents: Array.isArray(payload.parents) ? payload.parents : [],
    };
  }

  if (!isRecord(payload)) {
    throw new ApiError("Unexpected ToC node response payload.", 500);
  }

  const rawNodeId = asString(payload.id) ?? requestedNodeId;
  const rawBook = isRecord(payload.book) ? payload.book : null;
  const resolvedBookId = asString(rawBook?.id) ?? hintedBookId;
  const resolvedBookTitle = asString(rawBook?.title) ?? "Book";

  if (!resolvedBookId || !isUuid(resolvedBookId)) {
    throw new ApiError(
      "This backend did not return a valid bookId for the ToC node. Open this node from a book/plan link.",
      404,
    );
  }

  const rawParent = isRecord(payload.parent) ? payload.parent : null;
  const parentId = asString(rawParent?.id);
  const parentTitle = asString(rawParent?.title);

  return {
    node: {
      id: rawNodeId,
      parentId: asNullableString(payload.parentId),
      title: asString(payload.title) ?? "Untitled Section",
      order: asNumber(payload.order) ?? 0,
      depth: asNumber(payload.depth) ?? 1,
    },
    parents:
      parentId && parentTitle
        ? [
            {
              id: parentId,
              title: parentTitle,
            },
          ]
        : [],
    book: {
      id: resolvedBookId,
      title: resolvedBookTitle,
    },
  };
}

function isTocNodeDetail(value: unknown): value is TocNodeDetail {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.node) &&
    Array.isArray(value.parents) &&
    isRecord(value.book) &&
    typeof value.node.id === "string" &&
    typeof value.book.id === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNullableString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  return value === null ? null : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getLatestAssignment(
  nodeId: string,
): Promise<LatestAssignmentResult> {
  const response = await assignmentsControllerGetLatest(nodeId);

  if (response.status === 202) {
    return {
      state: "pending",
      pending: getData<AssignmentPendingState>(response),
    };
  }

  return {
    state: "ready",
    assignment: getData<Assignment>(response),
  };
}

export async function getLatestMaterial(
  nodeId: string,
  type: MaterialType,
): Promise<LatestMaterialResult> {
  const response = await apiFetch<ApiEnvelope<MaterialSet | MaterialPendingState>>(
    `/toc/${nodeId}/materials/${type}/latest`,
    {
      method: "GET",
    },
  );

  if (response.status === 202) {
    return {
      state: "pending",
      pending: response.data as MaterialPendingState,
    };
  }

  return {
    state: "ready",
    material: response.data as MaterialSet,
  };
}

export async function startMaterialSession(
  materialId: string,
): Promise<MaterialSession> {
  const response = await apiFetch<ApiEnvelope<MaterialSession>>(
    `/materials/${materialId}/sessions`,
    {
      method: "POST",
    },
  );

  return response.data;
}

export async function saveMaterialResponses(
  sessionId: string,
  responses: MaterialResponseInput[],
): Promise<MaterialSession> {
  const response = await apiFetch<ApiEnvelope<MaterialSession>>(
    `/material-sessions/${sessionId}/responses`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ responses }),
    },
  );

  return response.data;
}

export async function submitMaterialSession(
  sessionId: string,
): Promise<MaterialSession> {
  const response = await apiFetch<ApiEnvelope<MaterialSession>>(
    `/material-sessions/${sessionId}/submit`,
    {
      method: "POST",
    },
  );

  return response.data;
}

export async function getMaterialSession(
  sessionId: string,
): Promise<MaterialSession> {
  const response = await apiFetch<ApiEnvelope<MaterialSession>>(
    `/material-sessions/${sessionId}`,
    {
      method: "GET",
    },
  );

  return response.data;
}

export async function createAttempt(
  questionId: string,
  answerText: string,
): Promise<Attempt> {
  const response = await attemptsControllerCreate(questionId, {
    answerText,
  });

  const attempt = getData<Attempt>(response);
  cacheAttempt(questionId, {
    ...attempt,
    questionId,
  });

  return {
    ...attempt,
    questionId,
  };
}

export async function listAttempts(questionId: string): Promise<Attempt[]> {
  try {
    const response = await apiFetch<ApiEnvelope<Attempt[]>>(
      `/questions/${questionId}/attempts`,
      {
        method: "GET",
      },
    );

    setAttemptsForQuestion(questionId, response.data);

    return response.data;
  } catch (error: unknown) {
    if (isApiError(error) && error.status === 404) {
      return getCachedAttempts(questionId);
    }

    throw error;
  }
}

export async function gradeAttempt(attemptId: string): Promise<Attempt> {
  const response = await attemptsControllerGrade(attemptId);
  const attempt = getData<Attempt>(response);

  updateCachedAttempt(attempt);

  return attempt;
}

function rememberBookId(bookId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const ids = getRememberedBookIds();
  if (!ids.includes(bookId)) {
    ids.push(bookId);
    writeRememberedBookIds(ids);
  }
}

function rememberBookIds(bookIds: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueIds = new Set([...getRememberedBookIds(), ...bookIds]);
  writeRememberedBookIds([...uniqueIds]);
}

function getRememberedBookIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(KNOWN_BOOK_IDS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isUuid);
  } catch {
    return [];
  }
}

function writeRememberedBookIds(bookIds: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    KNOWN_BOOK_IDS_STORAGE_KEY,
    JSON.stringify([...new Set(bookIds)].slice(-100)),
  );
}

function findNodeWithParents(
  nodes: TocTreeNode[],
  targetNodeId: string,
  parents: TocTreeNode[],
): { node: TocTreeNode; parents: TocTreeNode[] } | null {
  for (const node of nodes) {
    if (node.id === targetNodeId) {
      return {
        node,
        parents,
      };
    }

    const foundInChildren = findNodeWithParents(node.children, targetNodeId, [
      ...parents,
      node,
    ]);

    if (foundInChildren) {
      return foundInChildren;
    }
  }

  return null;
}

function getCachedAttempts(questionId: string): Attempt[] {
  return [...(attemptsByQuestion.get(questionId) ?? [])];
}

function setAttemptsForQuestion(questionId: string, attempts: Attempt[]): void {
  attemptsByQuestion.set(questionId, attempts);
  for (const attempt of attempts) {
    questionIdByAttemptId.set(attempt.id, questionId);
  }
}

function cacheAttempt(questionId: string, attempt: Attempt): void {
  const existing = attemptsByQuestion.get(questionId) ?? [];
  const alreadyStored = existing.some((item) => item.id === attempt.id);

  const nextAttempts = alreadyStored
    ? existing.map((item) => (item.id === attempt.id ? attempt : item))
    : [attempt, ...existing];

  setAttemptsForQuestion(questionId, nextAttempts);
}

function updateCachedAttempt(attempt: Attempt): void {
  const questionId = questionIdByAttemptId.get(attempt.id) ?? attempt.questionId;
  if (!isUuid(questionId)) {
    return;
  }

  cacheAttempt(questionId, {
    ...attempt,
    questionId,
  });
}

function comparePlanItemByDateAsc(a: PlanItem, b: PlanItem): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) {
    return byDate;
  }

  const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
  if (byCreatedAt !== 0) {
    return byCreatedAt;
  }

  return a.id.localeCompare(b.id);
}

function comparePlanItemByDateDesc(a: PlanItem, b: PlanItem): number {
  return comparePlanItemByDateAsc(b, a);
}

function deriveSectionMetric(planItems: PlanItem[]) {
  const byNode = new Map<string, PlanItem[]>();

  for (const item of planItems) {
    const existing = byNode.get(item.tocNodeId);
    if (existing) {
      existing.push(item);
    } else {
      byNode.set(item.tocNodeId, [item]);
    }
  }

  const total = byNode.size;
  const completed = [...byNode.values()].filter((items) =>
    items.every((item) => item.status === "DONE"),
  ).length;

  return toMetricSummary(completed, total);
}

function deriveTypeMetric(
  planItems: PlanItem[],
  type: PlanItem["type"],
) {
  const matching = planItems.filter((item) => item.type === type);
  return toMetricSummary(
    matching.filter((item) => item.status === "DONE").length,
    matching.length,
  );
}

function normalizeMaybeBookOverview(
  overview: BookOverviewPayload | null | undefined,
): BookOverviewPayload | null {
  if (!overview || typeof overview !== "object") {
    return null;
  }

  return overview;
}

function resolveOverviewMetric(
  metricPayload: OverviewMetricPayload | null | undefined,
  completedScalar: number | null | undefined,
  totalScalar: number | null | undefined,
  fallbackCompleted: number,
  fallbackTotal: number,
) {
  const totalFromPayload =
    firstFiniteNumber([
      metricPayload?.total,
      totalScalar,
    ]) ?? fallbackTotal;
  const completedFromPayload =
    firstFiniteNumber([
      metricPayload?.completed,
      completedScalar,
    ]) ?? fallbackCompleted;
  const percentFromPayload = firstFiniteNumber([
    metricPayload?.percentComplete,
  ]);

  const summary = toMetricSummary(completedFromPayload, totalFromPayload);
  if (typeof percentFromPayload === "number") {
    return {
      ...summary,
      percentComplete: clampPercent(percentFromPayload),
    };
  }

  return summary;
}

function resolveOptionalOverviewMetric(
  metricPayload: OverviewMetricPayload | null | undefined,
  completedScalar: number | null | undefined,
  totalScalar: number | null | undefined,
) {
  const hasMetricPayload = Boolean(metricPayload && typeof metricPayload === "object");
  const hasCompletedScalar = typeof completedScalar === "number";
  const hasTotalScalar = typeof totalScalar === "number";

  if (!hasMetricPayload && !hasCompletedScalar && !hasTotalScalar) {
    return null;
  }

  return resolveOverviewMetric(metricPayload, completedScalar, totalScalar, 0, 0);
}

function toMetricSummary(completed: number, total: number) {
  const safeCompleted = clampNonNegative(completed);
  const safeTotal = clampNonNegative(total);
  const safeCappedCompleted = safeTotal > 0 ? Math.min(safeCompleted, safeTotal) : safeCompleted;

  return {
    completed: safeCappedCompleted,
    total: safeTotal,
    percentComplete:
      safeTotal > 0 ? clampPercent((safeCappedCompleted / safeTotal) * 100) : 0,
  };
}

function normalizeMaybeBookProgress(
  progress: BookProgressPayload | null | undefined,
): BookProgressSummary | null {
  if (!progress || typeof progress !== "object") {
    return null;
  }

  return normalizeBookProgress(progress);
}

function normalizeBookProgress(progress: BookProgressPayload): BookProgressSummary {
  const progressRecord = progress as BookProgressPayload & Record<string, unknown>;
  const doneItems = clampNonNegative(progress.doneItems);
  const totalItems = clampNonNegative(progress.totalItems);
  const computedPercent =
    totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const percentComplete = clampPercent(
    typeof progress.percentComplete === "number"
      ? progress.percentComplete
      : computedPercent,
  );
  const currentChapterOrSection =
    firstNonEmptyString([
      progress.currentChapterOrSection,
      progress.currentNodeTitle,
      progress.currentSectionTitle,
      progress.currentChapterTitle,
      progressRecord.currentChapterOrSectionName,
      progressRecord.currentTocTitle,
      progressRecord.currentTitle,
      progressRecord.currentNode,
    ]) ?? "Not started yet";
  const currentNodeId = firstUuid([
    progress.currentNodeId,
    progressRecord.currentTocNodeId,
    progressRecord.currentSectionId,
    progressRecord.currentNodeId,
  ]);
  const currentPlanId = firstUuid([
    progress.currentPlanId,
    progressRecord.currentStudyPlanId,
    progressRecord.currentPlanId,
  ]);

  return {
    doneItems,
    totalItems,
    percentComplete,
    currentChapterOrSection,
    currentNodeId,
    currentPlanId,
  };
}

function defaultBookProgress(): BookProgressSummary {
  return {
    doneItems: 0,
    totalItems: 0,
    percentComplete: 0,
    currentChapterOrSection: "Not started yet",
    currentNodeId: null,
    currentPlanId: null,
  };
}

function clampNonNegative(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function firstNonEmptyString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function firstUuid(values: unknown[]): string | null {
  for (const value of values) {
    if (isUuid(value)) {
      return value;
    }
  }

  return null;
}

function firstFiniteNumber(values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}
