"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { listLibraryBooksWithProgress } from "@/lib/api/endpoints";
import type { BookProgressSummary, LibraryBookRow } from "@/lib/api/models";
import { formatDateTime } from "@/lib/utils/date";

export default function LibraryPage() {
  const [books, setBooks] = useState<LibraryBookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasShownMissingProgressToast = useRef(false);

  async function loadBooks() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listLibraryBooksWithProgress();
      setBooks(result.books);

      if (
        result.missingProgressEndpoint &&
        !hasShownMissingProgressToast.current
      ) {
        toast.warning(
          "Book progress endpoint is missing (GET /books/:id/progress). Showing default progress.",
        );
        hasShownMissingProgressToast.current = true;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load books.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBooks();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground">
            View and open books for end-to-end backend testing.
          </p>
        </div>

        <Button asChild>
          <Link href="/books/new">
            <Plus className="size-4" />
            Add Book
          </Link>
        </Button>
      </div>

      {isLoading ? <LoadingState label="Loading books..." /> : null}

      {!isLoading && error ? (
        <ErrorAlert
          message={error}
          action={
            <Button type="button" variant="outline" onClick={() => void loadBooks()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {!isLoading && !error && books.length === 0 ? (
        <EmptyState
          title="No books yet"
          description="Create your first book to start uploading a table of contents and generating a study plan."
          action={
            <Button asChild>
              <Link href="/books/new">Create Book</Link>
            </Button>
          }
        />
      ) : null}

      {!isLoading && !error && books.length > 0 ? (
        <div className="grid gap-4">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="cursor-pointer transition-all duration-150 hover:bg-muted/20 hover:shadow-md">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <BookCover title={book.title} coverUrl={book.coverUrl} />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="line-clamp-2 break-words text-base group-hover:underline">
                            {book.title}
                          </CardTitle>

                          <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                            {book.author}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Created {formatDateTime(book.createdAt)}
                          </p>
                        </div>

                        <BookProgressPanel progress={book.progress} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

type BookCoverProps = {
  title: string;
  coverUrl: string | null;
};

function BookCover({ title, coverUrl }: BookCoverProps) {
  const [hasLoadError, setHasLoadError] = useState(false);

  const showImage = Boolean(coverUrl) && !hasLoadError;
  const isDataUrl = Boolean(coverUrl?.startsWith("data:"));

  return (
    <div className="h-40 w-28 shrink-0 overflow-hidden rounded-lg border bg-muted">
      {showImage ? (
        isDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl ?? ""}
            alt={`${title} cover`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasLoadError(true)}
          />
        ) : (
          <Image
            src={coverUrl ?? ""}
            alt={`${title} cover`}
            width={112}
            height={160}
            unoptimized
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasLoadError(true)}
          />
        )
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-muted-foreground">
          <ImageOff className="size-5" />
          <span className="text-[10px] font-medium uppercase tracking-wide">
            No cover
          </span>
        </div>
      )}
    </div>
  );
}

type BookProgressPanelProps = {
  progress: BookProgressSummary;
};

function BookProgressPanel({ progress }: BookProgressPanelProps) {
  return (
    <div className="flex items-center justify-between gap-3 sm:min-w-[340px] sm:justify-end sm:gap-5 sm:self-center">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <ProgressRing percent={progress.percentComplete} />

        <div className="min-w-0 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            CURRNET CHAPTER
          </p>
          <p className="line-clamp-1 text-base font-semibold text-foreground sm:text-lg">
            {progress.currentChapterOrSection}
          </p>
        </div>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
        Open
        <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
    </div>
  );
}

type ProgressRingProps = {
  percent: number;
};

function ProgressRing({ percent }: ProgressRingProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  const circleSize = 80;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safePercent / 100) * circumference;
  const [showOverallLabel, setShowOverallLabel] = useState(false);

  return (
    <div
      className="relative size-16 sm:size-20"
      title="Overall progress"
      onMouseEnter={() => setShowOverallLabel(true)}
      onMouseLeave={() => setShowOverallLabel(false)}
      onPointerDown={() => setShowOverallLabel(true)}
      onFocus={() => setShowOverallLabel(true)}
      onBlur={() => setShowOverallLabel(false)}
    >
      <svg
        viewBox={`0 0 ${circleSize} ${circleSize}`}
        className="size-full -rotate-90"
      >
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="stroke-primary transition-[stroke-dashoffset] duration-300"
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center px-1 text-center font-semibold text-foreground">
        {showOverallLabel ? (
          <span className="text-[8px] leading-tight sm:text-[9px]">
            Overall progress
          </span>
        ) : (
          <span className="text-sm sm:text-base">{safePercent}%</span>
        )}
      </span>
    </div>
  );
}
