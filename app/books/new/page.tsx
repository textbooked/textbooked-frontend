"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBook } from "@/lib/api/endpoints";

export default function NewBookPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !author.trim()) {
      toast.error("Title and author are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createBook({
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim() || undefined,
      });

      toast.success("Book created.");
      router.push(`/books/${created.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create book.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Book</h1>
          <p className="text-sm text-muted-foreground">
            Create a book entry before uploading its table of contents.
          </p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Designing Data-Intensive Applications"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="author">
                Author
              </label>
              <Input
                id="author"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Martin Kleppmann"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="coverUrl">
                Cover URL (optional)
              </label>
              <Input
                id="coverUrl"
                type="url"
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Book"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
