export type PlanItemType = "READ" | "ASSIGNMENT" | "TEST" | "REVIEW";

export type PlanItemStatus = "TODO" | "DONE";

export type BookSummary = {
  id: string;
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

export type AssignmentQuestion = {
  id: string;
  assignmentId: string;
  type: string;
  prompt: string;
  rubricJson?: string;
  rubric?: unknown;
  createdAt: string;
};

export type Assignment = {
  id: string;
  tocNodeId: string;
  version: number;
  createdAt: string;
  tocNode: {
    id: string;
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
  id: string;
  questionId: string;
  answerText: string;
  score: number | null;
  feedbackJson?: string | null;
  feedback?: AttemptFeedback | null;
  createdAt: string;
};
