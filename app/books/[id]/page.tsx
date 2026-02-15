"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorAlert } from "@/components/error-alert";
import { LoadingState } from "@/components/loading-state";
import { TocTree } from "@/components/toc/toc-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlan,
  generatePaces,
  getBook,
  getBookToc,
  uploadBookToc,
} from "@/lib/api/endpoints";
import type {
  BookDetail,
  PaceOption,
  TocTreeResponse,
} from "@/lib/api/models";
import { todayIsoDate } from "@/lib/utils/date";
import { parseRequiredUuid } from "@/lib/utils/uuid";

export default function BookOverviewPage() {
  const params = useParams<{ id: string }>();
  const bookId = useMemo(() => parseRequiredUuid(params.id), [params.id]);

  const [book, setBook] = useState<BookDetail | null>(null);
  const [toc, setToc] = useState<TocTreeResponse | null>(null);
  const [tocInput, setTocInput] = useState("");
  const [paceOptions, setPaceOptions] = useState<PaceOption[]>([]);
  const [selectedPaceId, setSelectedPaceId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingToc, setIsUploadingToc] = useState(false);
  const [isGeneratingPaces, setIsGeneratingPaces] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  const loadBookState = useCallback(async () => {
    if (!bookId) {
      setError("Invalid book id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [bookData, tocData] = await Promise.all([getBook(bookId), getBookToc(bookId)]);
      setBook(bookData);
      setToc(tocData);
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

  async function onUploadToc() {
    if (!bookId) {
      toast.error("Invalid book id.");
      return;
    }

    if (!tocInput.trim()) {
      toast.error("Paste ToC text before uploading.");
      return;
    }

    setIsUploadingToc(true);
    try {
      const uploaded = await uploadBookToc(bookId, tocInput.trim());
      setToc(uploaded);
      setTocInput("");
      setPaceOptions([]);
      setSelectedPaceId(null);
      toast.success("ToC uploaded.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload ToC.";
      toast.error(message);
    } finally {
      setIsUploadingToc(false);
    }
  }

  async function onGeneratePaces() {
    if (!bookId) {
      toast.error("Invalid book id.");
      return;
    }

    setIsGeneratingPaces(true);
    setCreatedPlanId(null);

    try {
      const response = await generatePaces(bookId);
      setPaceOptions(response.options);
      setSelectedPaceId(response.options[0]?.id ?? null);
      toast.success("Pace options generated.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate pace options.";
      toast.error(message);
    } finally {
      setIsGeneratingPaces(false);
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
      const created = await createPlan(bookId, {
        paceOptionId: selectedPaceId,
        startDate,
      });

      setCreatedPlanId(created.id);
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
              <CardTitle className="text-base">Upload ToC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={tocInput}
                onChange={(event) => setTocInput(event.target.value)}
                placeholder="Paste textbook table of contents text..."
                rows={8}
              />

              <Button type="button" onClick={() => void onUploadToc()} disabled={isUploadingToc}>
                {isUploadingToc ? "Uploading..." : "Upload ToC"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ToC Tree</CardTitle>
            </CardHeader>
            <CardContent>
              {toc && toc.nodes.length > 0 ? (
                <TocTree nodes={toc.nodes} linkToNodes bookId={bookId ?? undefined} />
              ) : (
                <EmptyState
                  title="No ToC yet"
                  description="Upload ToC text to parse and render the chapter tree."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pace Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => void onGeneratePaces()}
                disabled={isGeneratingPaces}
              >
                <Sparkles className="size-4" />
                {isGeneratingPaces ? "Generating..." : "Generate Pace Options"}
              </Button>

              <Separator />

              {paceOptions.length === 0 ? (
                <EmptyState
                  title="No pace options"
                  description="Generate pace options after uploading a ToC."
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
                          {option.sessionsPerWeek} sessions/week • {option.minutesPerSession} min/session
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="pace-option"
                        checked={selectedPaceId === option.id}
                        onChange={() => setSelectedPaceId(option.id)}
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
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => void onCreatePlan()}
                      disabled={isCreatingPlan || !selectedPaceId}
                    >
                      {isCreatingPlan ? "Creating..." : "Create Plan"}
                    </Button>

                    {createdPlanId ? (
                      <Button asChild variant="secondary">
                        <Link href={`/plans/${createdPlanId}`}>Open Plan #{createdPlanId}</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
