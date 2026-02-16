export type PlanItemType = "READ" | "ASSIGNMENT" | "TEST" | "REVIEW";

export type PlanItemStatus = "TODO" | "DONE";
export type AssignmentGenerationStatus =
  | "PENDING"
  | "RUNNING"
  | "READY"
  | "PARTIAL_FAILED";
export type MaterialGenerationStatus = AssignmentGenerationStatus;

export type MaterialType = "ASSIGNMENT" | "REVIEW" | "TEST";
export type MaterialQuestionFormat = "MCQ" | "WRITTEN";
export type MaterialSessionStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADING"
  | "GRADED"
  | "EXPIRED_AUTO_SUBMITTED";

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

export type OverviewMetricPayload = {
  completed?: number | null;
  total?: number | null;
  percentComplete?: number | null;
};

export type BookOverviewPayload = {
  overallPercent?: number | null;
  completedSections?: number | null;
  totalSections?: number | null;
  completedAssignments?: number | null;
  totalAssignments?: number | null;
  completedReviews?: number | null;
  totalReviews?: number | null;
  completedTests?: number | null;
  totalTests?: number | null;
  completedQuestions?: number | null;
  totalQuestions?: number | null;
  currentNodeTitle?: string | null;
  currentChapterOrSection?: string | null;
  sections?: OverviewMetricPayload | null;
  assignments?: OverviewMetricPayload | null;
  reviews?: OverviewMetricPayload | null;
  tests?: OverviewMetricPayload | null;
  questions?: OverviewMetricPayload | null;
};

export type OverviewMetricSummary = {
  completed: number;
  total: number;
  percentComplete: number;
};

export type BookOverviewSummary = {
  overallPercent: number;
  sections: OverviewMetricSummary;
  assignments: OverviewMetricSummary;
  reviews: OverviewMetricSummary;
  tests: OverviewMetricSummary;
  questions: OverviewMetricSummary | null;
  currentChapterOrSection: string;
};

export type BookSummary = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  createdAt: string;
  progress?: BookProgressPayload | null;
  overview?: BookOverviewPayload | null;
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

export type BookEnrollmentResult = {
  bookId: string;
  userId: string;
  enrolledAt: string;
  alreadyEnrolled: boolean;
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
  materialsGeneration?: BookMaterialsGenerationStatus;
};

export type BookAssignmentGenerationStatus = {
  bookId: string;
  status: AssignmentGenerationStatus;
  totalSections: number;
  generatedSections: number;
  failedSections: number;
  updatedAt: string;
};

export type MaterialTypeProgress = {
  type: MaterialType;
  totalSections: number;
  generatedSections: number;
  pendingSections: number;
  runningSections: number;
  failedSections: number;
};

export type BookMaterialsGenerationStatus = {
  bookId: string;
  status: MaterialGenerationStatus;
  byType: Record<MaterialType, MaterialTypeProgress>;
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

export type MaterialQuestion = {
  id: string;
  materialSetId: string;
  order: number;
  format: MaterialQuestionFormat;
  prompt: string;
  options: string[] | null;
  rubric: unknown;
  maxPoints: number;
  createdAt: string;
  updatedAt: string;
};

export type MaterialResponse = {
  id: string;
  questionId: string;
  selectedOptionIndex: number | null;
  answerText: string | null;
  scoreRaw: number | null;
  maxRaw: number | null;
  feedback: unknown;
  createdAt: string;
  updatedAt: string;
};

export type MaterialSession = {
  id: string;
  materialSetId: string;
  status: MaterialSessionStatus;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  scoreRaw: number | null;
  scoreMax: number | null;
  scorePercent: number | null;
  passed: boolean | null;
  passThresholdPercent: number;
  createdAt: string;
  updatedAt: string;
  responses: MaterialResponse[];
};

export type MaterialSet = {
  id: string;
  tocNodeId: string;
  type: MaterialType;
  isLocked: boolean;
  questionCount: number;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
  tocNode: {
    id: string;
    title: string;
    depth: number;
    order: number;
  };
  questions: MaterialQuestion[];
  latestSession: MaterialSession | null;
};

export type MaterialPendingState = {
  nodeId: string;
  bookId: string;
  type: MaterialType;
  sectionStatus: "PENDING" | "RUNNING" | "FAILED";
  attemptCount: number;
  nextRetryAt: string | null;
  message: string;
  materialsGeneration: BookMaterialsGenerationStatus;
};

export type LatestMaterialResult =
  | {
      state: "ready";
      material: MaterialSet;
    }
  | {
      state: "pending";
      pending: MaterialPendingState;
    };

export type MaterialResponseInput = {
  questionId: string;
  selectedOptionIndex?: number;
  answerText?: string;
};
