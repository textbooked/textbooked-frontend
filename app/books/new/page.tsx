"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { analyzeBookIntake, finalizeBookIntake } from "@/lib/api/endpoints";
import type { BookIntakeAnalyzeResult } from "@/lib/api/models";

const MAX_PDF_UPLOAD_BYTES = 25 * 1024 * 1024;
const COVER_PREVIEW_MAX_WIDTH = 320;
const PICKER_PREVIEW_MAX_WIDTH = 900;

type WizardStep = 1 | 2 | 3;
type PagePickerMode = "cover" | "tocStart" | "tocEnd";

type PdfViewportLike = {
  width: number;
  height: number;
};

type PdfRenderTaskLike = {
  promise: Promise<void>;
};

type PdfPageLike = {
  getViewport: (options: { scale: number }) => PdfViewportLike;
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewportLike;
    canvas?: HTMLCanvasElement;
  }) => PdfRenderTaskLike;
};

type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
  destroy: () => Promise<void> | void;
};

type PdfjsLike = {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (source: { data: Uint8Array }) => {
    promise: Promise<PdfDocumentLike>;
  };
};

let pdfjsModulePromise: Promise<PdfjsLike> | null = null;

async function loadPdfjsModule(): Promise<PdfjsLike> {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    ) as unknown as Promise<PdfjsLike>;
  }

  const pdfjsModule = await pdfjsModulePromise;
  if (!pdfjsModule.GlobalWorkerOptions.workerSrc) {
    pdfjsModule.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }

  return pdfjsModule;
}

export default function NewBookPage() {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [coverPage, setCoverPage] = useState(1);
  const [tocStartPage, setTocStartPage] = useState(1);
  const [tocEndPage, setTocEndPage] = useState(1);
  const [analyzeResult, setAnalyzeResult] = useState<BookIntakeAnalyzeResult | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tocText, setTocText] = useState("");

  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [isRenderingCover, setIsRenderingCover] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [pickerState, setPickerState] = useState<{
    mode: PagePickerMode;
    page: number;
  } | null>(null);
  const [isRenderingPicker, setIsRenderingPicker] = useState(false);

  const coverCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pickerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocumentRef = useRef<PdfDocumentLike | null>(null);
  const renderRequestIdRef = useRef(0);
  const pickerRenderRequestIdRef = useRef(0);

  const hasValidTocRange = useMemo(() => {
    if (!pageCount) {
      return false;
    }

    return (
      isValidPageNumber(tocStartPage, pageCount) &&
      isValidPageNumber(tocEndPage, pageCount) &&
      tocStartPage <= tocEndPage
    );
  }, [pageCount, tocEndPage, tocStartPage]);

  useEffect(() => {
    return () => {
      void destroyPdfDocument(pdfDocumentRef);
    };
  }, []);

  useEffect(() => {
    if (step < 2 || !pageCount || !isValidPageNumber(coverPage, pageCount)) {
      return;
    }

    const canvas = coverCanvasRef.current;
    const document = pdfDocumentRef.current;
    if (!canvas || !document) {
      return;
    }

    let disposed = false;
    const requestId = ++renderRequestIdRef.current;
    setIsRenderingCover(true);

    void (async () => {
      try {
        await renderPdfPageToCanvas(
          document,
          coverPage,
          canvas,
          COVER_PREVIEW_MAX_WIDTH,
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to render cover preview.";
        toast.error(message);
      } finally {
        if (!disposed && requestId === renderRequestIdRef.current) {
          setIsRenderingCover(false);
        }
      }
    })();

    return () => {
      disposed = true;
    };
  }, [coverPage, pageCount, step]);

  useEffect(() => {
    if (!pickerState || !pageCount) {
      return;
    }

    const canvas = pickerCanvasRef.current;
    const document = pdfDocumentRef.current;
    if (!canvas || !document) {
      return;
    }

    let disposed = false;
    const requestId = ++pickerRenderRequestIdRef.current;
    setIsRenderingPicker(true);

    void (async () => {
      try {
        await renderPdfPageToCanvas(
          document,
          pickerState.page,
          canvas,
          PICKER_PREVIEW_MAX_WIDTH,
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to render page preview.";
        toast.error(message);
      } finally {
        if (!disposed && requestId === pickerRenderRequestIdRef.current) {
          setIsRenderingPicker(false);
        }
      }
    })();

    return () => {
      disposed = true;
    };
  }, [pickerState, pageCount]);

  async function onPdfSelected(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";

    if (!selected) {
      return;
    }

    if (selected.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    if (selected.size > MAX_PDF_UPLOAD_BYTES) {
      toast.error("PDF is too large. Maximum size is 25MB.");
      return;
    }

    setIsPreparingPdf(true);
    try {
      await destroyPdfDocument(pdfDocumentRef);

      const pdfjs = await loadPdfjsModule();
      const bytes = new Uint8Array(await selected.arrayBuffer());
      const loadingTask = pdfjs.getDocument({ data: bytes });
      const document = await loadingTask.promise;

      if (document.numPages < 1) {
        throw new Error("The selected PDF has no readable pages.");
      }

      pdfDocumentRef.current = document;
      setPdfFile(selected);
      setPageCount(document.numPages);
      setCoverPage(1);
      setTocStartPage(1);
      setTocEndPage(Math.min(2, document.numPages));
      setAnalyzeResult(null);
      setTitle("");
      setAuthor("");
      setTocText("");
      setPickerState(null);
      setStep(2);
    } catch (error: unknown) {
      await destroyPdfDocument(pdfDocumentRef);
      const message =
        error instanceof Error ? error.message : "Failed to read the selected PDF.";
      toast.error(message);
    } finally {
      setIsPreparingPdf(false);
    }
  }

  async function onAnalyzeSelection() {
    if (!pdfFile) {
      toast.error("Upload a PDF first.");
      return;
    }

    if (!pageCount || !hasValidTocRange) {
      toast.error("Please select a valid ToC page range.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeBookIntake(pdfFile, tocStartPage, tocEndPage);
      setAnalyzeResult(result);
      setTitle(result.suggestedTitle);
      setAuthor(result.suggestedAuthor);
      setTocText(result.extractedTocText);
      setStep(3);
      toast.success("ToC extracted. Review details before creating the book.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to analyze PDF selection.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function onFinalize() {
    if (!pdfFile) {
      toast.error("Upload a PDF first.");
      return;
    }

    if (!title.trim() || !author.trim()) {
      toast.error("Title and author are required.");
      return;
    }

    if (tocText.trim().length < 10) {
      toast.error("ToC text must be at least 10 characters.");
      return;
    }

    const canvas = coverCanvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      toast.error("Cover preview is not ready yet.");
      return;
    }

    const coverImageDataUrl = exportCoverDataUrl(canvas);
    if (!coverImageDataUrl) {
      toast.error("Failed to export cover image.");
      return;
    }

    setIsFinalizing(true);
    try {
      const response = await finalizeBookIntake({
        title: title.trim(),
        author: author.trim(),
        tocText: tocText.trim(),
        coverImageDataUrl,
        sourceMeta: {
          fileName: pdfFile.name,
          coverPage,
          tocStartPage,
          tocEndPage,
        },
      });

      toast.success("Textbook created.");
      router.push(`/books/${response.book.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create textbook.";
      toast.error(message);
    } finally {
      setIsFinalizing(false);
    }
  }

  function openPagePicker(mode: PagePickerMode) {
    if (!pageCount) {
      return;
    }

    const currentPage =
      mode === "cover"
        ? coverPage
        : mode === "tocStart"
          ? tocStartPage
          : tocEndPage;

    setPickerState({
      mode,
      page: clampPageNumber(currentPage, pageCount),
    });
  }

  function movePickerPage(delta: number) {
    if (!pageCount) {
      return;
    }

    setPickerState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        page: clampPageNumber(current.page + delta, pageCount),
      };
    });
  }

  function applyPickerSelection() {
    if (!pickerState || !pageCount) {
      return;
    }

    const selectedPage = clampPageNumber(pickerState.page, pageCount);

    if (pickerState.mode === "cover") {
      setCoverPage(selectedPage);
    }

    if (pickerState.mode === "tocStart") {
      setTocStartPage(selectedPage);
      setTocEndPage((current) => Math.max(current, selectedPage));
    }

    if (pickerState.mode === "tocEnd") {
      setTocEndPage(selectedPage);
      setTocStartPage((current) => Math.min(current, selectedPage));
    }

    setPickerState(null);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Textbook</h1>
          <p className="text-sm text-muted-foreground">
            Upload a PDF, pick pages visually, then review extracted details.
          </p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <StepPill label="1. Upload PDF" active={step === 1} done={step > 1} />
        <StepPill
          label="2. Select Cover + ToC"
          active={step === 2}
          done={step > 2}
        />
        <StepPill label="3. Review + Create" active={step === 3} done={false} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1: Upload PDF</CardTitle>
          <CardDescription>
            PDF is parsed in backend for metadata and ToC text only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="application/pdf"
            onChange={onPdfSelected}
            disabled={isPreparingPdf}
          />

          {isPreparingPdf ? (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading selected PDF...
            </p>
          ) : null}

          {pdfFile && pageCount ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{pdfFile.name}</p>
              <p className="text-muted-foreground">{pageCount} pages detected</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {step >= 2 && pageCount ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2: Select Cover and ToC Range</CardTitle>
            <CardDescription>
              Pick pages from visual preview. No manual page-number typing required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Cover page</p>
                <p className="text-base font-semibold">{coverPage}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => openPagePicker("cover")}
                >
                  Select Cover
                </Button>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">ToC start page</p>
                <p className="text-base font-semibold">{tocStartPage}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => openPagePicker("tocStart")}
                >
                  Select Start
                </Button>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">ToC end page</p>
                <p className="text-base font-semibold">{tocEndPage}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => openPagePicker("tocEnd")}
                >
                  Select End
                </Button>
              </div>
            </div>

            {!hasValidTocRange ? (
              <p className="text-sm text-destructive">
                Select a valid ToC range where start page is less than or equal to end
                page.
              </p>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium">Cover preview</p>
              <div className="overflow-auto rounded-md border bg-muted/30 p-3">
                <canvas ref={coverCanvasRef} className="block rounded border bg-background" />
              </div>
              {isRenderingCover ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Rendering selected cover page...
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isAnalyzing}
              >
                Change PDF
              </Button>

              <Button
                type="button"
                onClick={() => void onAnalyzeSelection()}
                disabled={
                  isAnalyzing ||
                  isRenderingCover ||
                  !pdfFile ||
                  !pageCount ||
                  !hasValidTocRange
                }
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Selection"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step >= 3 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 3: Review and Create</CardTitle>
            <CardDescription>
              Edit metadata and ToC text before creating the textbook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyzeResult?.warnings.length ? (
              <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {analyzeResult.warnings.map((warning) => (
                  <p key={warning}>- {warning}</p>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Database System Concepts"
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
                placeholder="Abraham Silberschatz"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tocText">
                Extracted ToC text
              </label>
              <Textarea
                id="tocText"
                value={tocText}
                onChange={(event) => setTocText(event.target.value)}
                rows={14}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back to Selection
              </Button>

              <Button
                type="button"
                onClick={() => void onFinalize()}
                disabled={isFinalizing || isRenderingCover}
              >
                {isFinalizing ? "Creating..." : "Create Textbook"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {pickerState && pageCount ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-lg border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-base font-semibold">
                {pickerState.mode === "cover"
                  ? "Select Cover Page"
                  : pickerState.mode === "tocStart"
                    ? "Select ToC Start Page"
                    : "Select ToC End Page"}
              </h2>
              <Button type="button" variant="ghost" onClick={() => setPickerState(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => movePickerPage(-1)}
                  disabled={pickerState.page <= 1}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <p className="text-sm font-medium">
                  Page {pickerState.page} of {pageCount}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => movePickerPage(1)}
                  disabled={pickerState.page >= pageCount}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-3">
                <canvas
                  ref={pickerCanvasRef}
                  className="mx-auto block cursor-pointer rounded border bg-background"
                  onClick={applyPickerSelection}
                />
              </div>

              {isRenderingPicker ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Rendering page preview...
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tip: click the page preview or press “Use This Page”.
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPickerState(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={applyPickerSelection}
                  disabled={isRenderingPicker}
                >
                  Use This Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type StepPillProps = {
  label: string;
  active: boolean;
  done: boolean;
};

function StepPill({ label, active, done }: StepPillProps) {
  const className = active
    ? "border-primary bg-primary/10 text-primary"
    : done
      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
      : "border-muted bg-muted/30 text-muted-foreground";

  return <span className={`rounded-full border px-3 py-1 ${className}`}>{label}</span>;
}

function isValidPageNumber(value: number, pageCount: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= pageCount;
}

function clampPageNumber(value: number, pageCount: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(pageCount, Math.max(1, Math.round(value)));
}

function exportCoverDataUrl(canvas: HTMLCanvasElement): string | null {
  try {
    const webp = canvas.toDataURL("image/webp", 0.82);
    if (webp.startsWith("data:image/webp;base64,")) {
      return webp;
    }
  } catch {
    // fall through
  }

  try {
    const jpeg = canvas.toDataURL("image/jpeg", 0.86);
    if (jpeg.startsWith("data:image/jpeg;base64,")) {
      return jpeg;
    }
  } catch {
    // fall through
  }

  try {
    const png = canvas.toDataURL("image/png");
    if (png.startsWith("data:image/png;base64,")) {
      return png;
    }
  } catch {
    return null;
  }

  return null;
}

async function renderPdfPageToCanvas(
  document: PdfDocumentLike,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  maxWidth: number,
): Promise<void> {
  const page = await document.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const previewScale =
    baseViewport.width > maxWidth ? maxWidth / baseViewport.width : 1;
  const viewport = page.getViewport({ scale: previewScale });

  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to get PDF page preview context.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport, canvas }).promise;
}

async function destroyPdfDocument(
  documentRef: { current: PdfDocumentLike | null },
): Promise<void> {
  const existing = documentRef.current;
  documentRef.current = null;

  if (!existing) {
    return;
  }

  try {
    await Promise.resolve(existing.destroy());
  } catch {
    // best effort cleanup
  }
}
