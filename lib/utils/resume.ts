"use client";

import { isUuid } from "@/lib/utils/uuid";

const RESUME_STORAGE_KEY = "textbooked.resumeByBook";
const MAX_RESUME_BOOKS = 50;

type ResumeEntry = {
  nodeId: string;
  planId: string | null;
  updatedAt: number;
};

type ResumeByBook = Record<string, ResumeEntry>;

export function readLastOpenedNode(bookId: string): string | null {
  if (!isUuid(bookId)) {
    return null;
  }

  const entry = readResumeEntry(bookId);
  return entry?.nodeId ?? null;
}

export function readLastOpenedPlanId(bookId: string): string | null {
  if (!isUuid(bookId)) {
    return null;
  }

  const entry = readResumeEntry(bookId);
  return entry?.planId ?? null;
}

export function writeLastOpenedNode(
  bookId: string,
  nodeId: string,
  planId?: string | null,
): void {
  if (!isUuid(bookId) || !isUuid(nodeId) || typeof window === "undefined") {
    return;
  }

  const current = readResumeMap();
  const previous = current[bookId];
  const normalizedPlanId = isUuid(planId)
    ? planId
    : planId === null
      ? null
      : previous?.planId ?? null;

  current[bookId] = {
    nodeId,
    planId: normalizedPlanId,
    updatedAt: Date.now(),
  };

  const trimmed = trimResumeMap(current);
  window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(trimmed));
}

function readResumeEntry(bookId: string): ResumeEntry | null {
  const all = readResumeMap();
  const entry = all[bookId];

  if (!entry || !isUuid(entry.nodeId)) {
    return null;
  }

  return {
    nodeId: entry.nodeId,
    planId: isUuid(entry.planId) ? entry.planId : null,
    updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
  };
}

function readResumeMap(): ResumeByBook {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const entries = Object.entries(parsed).filter(
      (entry): entry is [string, ResumeEntry] => {
        const [bookId, value] = entry;
        if (!isUuid(bookId) || !value || typeof value !== "object") {
          return false;
        }

        const candidate = value as Partial<ResumeEntry>;
        return isUuid(candidate.nodeId);
      },
    );

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function trimResumeMap(input: ResumeByBook): ResumeByBook {
  const entries = Object.entries(input)
    .filter((entry) => isUuid(entry[0]) && isUuid(entry[1].nodeId))
    .sort((a, b) => (b[1].updatedAt ?? 0) - (a[1].updatedAt ?? 0))
    .slice(0, MAX_RESUME_BOOKS);

  return Object.fromEntries(entries);
}
