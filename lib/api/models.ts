export type PlanItemType = "READ" | "ASSIGNMENT" | "TEST" | "REVIEW";

export type PlanItemStatus = "TODO" | "DONE";

export type BookSummary = {
  id: number;
  title: string;
  author: string;
  coverUrl: string | null;
  createdAt: string;
};

export type BookDetail = BookSummary & {
  _count?: {
    tocNodes: number;
    paceOptions: number;
    plans: number;
  };
};

export type TocTreeNode = {
  id: number;
  parentId: number | null;
  title: string;
  order: number;
  depth: number;
  createdAt: string;
  children: TocTreeNode[];
};

export type TocTreeResponse = {
  bookId: number;
  totalNodes: number;
  nodes: TocTreeNode[];
};

export type TocNodeBreadcrumb = {
  id: number;
  title: string;
};

export type TocNodeDetail = {
  node: {
    id: number;
    parentId: number | null;
    title: string;
    order: number;
    depth: number;
  };
  parents: TocNodeBreadcrumb[];
  book: {
    id: number;
    title: string;
  };
};

export type PaceOption = {
  id: number;
  bookId: number;
  name: string;
  sessionsPerWeek: number;
  minutesPerSession: number;
  createdAt: string;
};

export type PaceGenerationResponse = {
  bookId: number;
  promptVersion?: string;
  options: PaceOption[];
};

export type PlanItem = {
  id: number;
  planId: number;
  date: string;
  tocNodeId: number;
  type: PlanItemType;
  status: PlanItemStatus;
  createdAt: string;
  tocNode: {
    id: number;
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
  id: number;
  bookId: number;
  paceOptionId: number;
  startDate: string;
  createdAt: string;
  book: BookSummary;
  paceOption: PaceOption;
  planItems: PlanItem[];
  progress?: PlanProgress;
};

export type AssignmentQuestion = {
  id: number;
  assignmentId: number;
  type: string;
  prompt: string;
  rubricJson?: string;
  rubric?: unknown;
  createdAt: string;
};

export type Assignment = {
  id: number;
  tocNodeId: number;
  version: number;
  createdAt: string;
  tocNode: {
    id: number;
    title: string;
    depth: number;
    order: number;
  };
  questions: AssignmentQuestion[];
};

export type AttemptFeedback = {
  promptVersion?: string;
  hits?: string[];
  misses?: string[];
  followupProbe?: string | null;
};

export type Attempt = {
  id: number;
  questionId: number;
  answerText: string;
  score: number | null;
  feedbackJson?: string | null;
  feedback?: AttemptFeedback | null;
  createdAt: string;
};
