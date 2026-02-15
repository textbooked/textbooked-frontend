"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listBooks } from "@/lib/api/endpoints";
import type { BookSummary } from "@/lib/api/models";
import { formatDateTime } from "@/lib/utils/date";

export default function LibraryPage() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBooks() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listBooks();
      setBooks(data);
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
            <Card key={book.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    <Link href={`/books/${book.id}`} className="hover:underline">
                      {book.title}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </div>
                <Badge variant="secondary">#{book.id}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Created {formatDateTime(book.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
