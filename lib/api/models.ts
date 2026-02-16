export type PlanItemType = "READ" | "ASSIGNMENT" | "TEST" | "REVIEW";

export type PlanItemStatus = "TODO" | "DONE";
export type AssignmentGenerationStatus = "PENDING" | "RUNNING" | "READY" | "PARTIAL_FAILED";

export type BookProgressPayload = {
  doneItems?: number | null;
  totalItems?: number | null;
  percentComplete?: number | null;
  currentChapterOrSection?: string | null;
  currentNodeId?: string | null;
  currentPlanId?: string | null;
  currentNodeTitle?: string | null;
  currentSectionTitle?: string | null;
  currentChapterTitle?: string | null;
};

export type BookProgressSummary = {
  doneItems: number;
  totalItems: number;
  percentComplete: number;
  currentChapterOrSection: string;
  currentNodeId: string | null;
  currentPlanId: string | null;
};

export type BookSummary = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  createdAt: string;
  progress?: BookProgressPayload | null;
};

export type LibraryBookRow = Omit<BookSummary, "progress"> & {
  progress: BookProgressSummary;
};

export type BookDetail = BookSummary & {
  _count?: {
    tocNodes: number;
    paceOptions: number;
    plans: number;
  };
};

export type BookIntakeAnalyzeResult = {
  fileName: string;
  pageCount: number;
  suggestedTitle: string;
  suggestedAuthor: string;
  extractedTocText: string;
  tocPageRange: {
    start: number;
    end: number;
  };
  warnings: string[];
};

export type BookIntakeFinalizeSourceMeta = {
  fileName?: string;
  coverPage?: number;
  tocStartPage?: number;
  tocEndPage?: number;
};

export type BookIntakeFinalizeInput = {
  title: string;
  author: string;
  tocText: string;
  coverImageDataUrl: string;
  sourceMeta?: BookIntakeFinalizeSourceMeta;
};

export type BookIntakeFinalizeResult = {
  book: BookSummary;
  tocSummary: {
    totalNodes: number;
  };
  paceSummary: {
    totalOptions: number;
  };
  assignmentGeneration: BookAssignmentGenerationStatus;
};

export type BookAssignmentGenerationStatus = {
  bookId: string;
  status: AssignmentGenerationStatus;
  totalSections: number;
  generatedSections: number;
  failedSections: number;
  updatedAt: string;
};

export type TocTreeNode = {
  id: string;
  parentId: string | null;
  title: string;
  order: number;
  depth: number;
  createdAt: string;
  children: TocTreeNode[];
};

export type TocTreeResponse = {
  bookId: string;
  totalNodes: number;
  nodes: TocTreeNode[];
};

export type TocNodeBreadcrumb = {
  id: string;
  title: string;
};

export type TocNodeDetail = {
  node: {
    id: string;
    parentId: string | null;
    title: string;
    order: number;
    depth: number;
  };
  parents: TocNodeBreadcrumb[];
  book: {
    id: string;
    title: string;
  };
};

export type PaceOption = {
  id: string;
  bookId: string;
  name: string;
  sessionsPerWeek: number;
  minutesPerSession: number;
  createdAt: string;
};

export type PaceGenerationResponse = {
  bookId: string;
  promptVersion?: string;
  options: PaceOption[];
};

export type PlanItem = {
  id: string;
  planId: string;
  date: string;
  tocNodeId: string;
  type: PlanItemType;
  status: PlanItemStatus;
  createdAt: string;
  tocNode: {
    id: string;
    title: string;
    depth: number;
    order: number;
  };
};

export type PlanProgress = {
  totalItems: number;
  doneItems: number;
  percentComplete: number;
};

export type PlanDetail = {
  id: string;
  bookId: string;
  paceOptionId: string;
  startDate: string;
  createdAt: string;
  book: BookSummary;
  paceOption: PaceOption;
  planItems: PlanItem[];
  progress?: PlanProgress;
};

export type AttemptFeedback = {
  promptVersion?: string;
  hits?: string[];
  misses?: string[];
  followupProbe?: string | null;
};

export type Attempt = {
  id: string;
  questionId: string;
  answerText: string;
  score: number | null;
  feedbackJson?: string | null;
  feedback?: AttemptFeedback | null;
  createdAt: string;
};

export type AssignmentQuestion = {
  id: string;
  assignmentId: string;
  type: string;
  prompt: string;
  rubricJson?: string;
  rubric?: unknown;
  createdAt: string;
  attempts?: Attempt[];
};

export type Assignment = {
  id: string;
  tocNodeId: string;
  createdAt: string;
  tocNode: {
    id: string;
    title: string;
    depth: number;
    order: number;
  };
  questions: AssignmentQuestion[];
};

export type AssignmentPendingState = {
  nodeId: string;
  bookId: string;
  sectionStatus: "PENDING" | "RUNNING" | "FAILED";
  attemptCount: number;
  nextRetryAt: string | null;
  message: string;
  assignmentGeneration: BookAssignmentGenerationStatus;
};

export type LatestAssignmentResult =
  | {
      state: "ready";
      assignment: Assignment;
    }
  | {
      state: "pending";
      pending: AssignmentPendingState;
    };
