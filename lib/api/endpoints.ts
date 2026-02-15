import {
  assignmentsControllerGenerate,
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
  Attempt,
  BookDetail,
  BookSummary,
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
    const response = await apiFetch<ApiEnvelope<TocNodeDetail>>(`/toc/${nodeId}`, {
      method: "GET",
    });

    return response.data;
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

export async function getLatestAssignment(
  nodeId: string,
): Promise<Assignment | null> {
  try {
    const response = await assignmentsControllerGetLatest(nodeId);
    return getData<Assignment>(response);
  } catch (error: unknown) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function generateAssignment(nodeId: string): Promise<Assignment> {
  const response = await assignmentsControllerGenerate(nodeId);
  return getData<Assignment>(response);
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
