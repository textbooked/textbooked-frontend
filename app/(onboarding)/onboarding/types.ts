import type {
  CreateOnboardingStudyPlanRequestDto,
  EducationLevel,
  OnboardingLevel,
  SourceType,
  StudyPlanMode,
} from "@/lib/api/schemas";

export const ONBOARDING_SKIP_STORAGE_KEY = "textbooked-onboarding-skip-v1";
export const ONBOARDING_DRAFT_STORAGE_KEY = "textbooked-onboarding-draft-v1";

export type OnboardingStepId =
  | "mode"
  | "goal-or-source"
  | "intensity"
  | "background"
  | "review";

export type OnboardingWizardDraft = {
  mode: StudyPlanMode | null;
  goalPrompt: string;
  category: string;
  level: OnboardingLevel | null;
  intensity: number | null;
  sourceType: SourceType | null;
  sourceTitle: string;
  sourceUri: string;
  backgroundJobPositionTitle: string;
  backgroundHighestEducationLevel: EducationLevel | null;
  backgroundSummary: string;
  backgroundCompany: string;
  backgroundEducationText: string;
};

export type OnboardingWizardState = {
  draft: OnboardingWizardDraft;
  currentStepIndex: number;
  steps: OnboardingStepId[];
  errorMessage: string | null;
  isSubmitting: boolean;
};

export type OnboardingWizardApi = {
  state: OnboardingWizardState;
  setMode: (value: StudyPlanMode) => void;
  setGoalPrompt: (value: string) => void;
  setCategory: (value: string) => void;
  setLevel: (value: OnboardingLevel | null) => void;
  setIntensity: (value: number) => void;
  setSourceType: (value: SourceType | null) => void;
  setSourceTitle: (value: string) => void;
  setSourceUri: (value: string) => void;
  setBackgroundJobPositionTitle: (value: string) => void;
  setBackgroundHighestEducationLevel: (value: EducationLevel | null) => void;
  setBackgroundSummary: (value: string) => void;
  setBackgroundCompany: (value: string) => void;
  setBackgroundEducationText: (value: string) => void;
  goBack: () => void;
  goNext: () => void;
  skipForNow: () => void;
  exitOnboarding: () => void;
  submit: () => Promise<void>;
};

export function createDefaultOnboardingDraft(): OnboardingWizardDraft {
  return {
    mode: null,
    goalPrompt: "",
    category: "",
    level: null,
    intensity: 3,
    sourceType: null,
    sourceTitle: "",
    sourceUri: "",
    backgroundJobPositionTitle: "",
    backgroundHighestEducationLevel: null,
    backgroundSummary: "",
    backgroundCompany: "",
    backgroundEducationText: "",
  };
}

export function toCreatePlanPayload(
  draft: OnboardingWizardDraft,
): CreateOnboardingStudyPlanRequestDto {
  const mode = draft.mode ?? "GUIDED";
  const payload: CreateOnboardingStudyPlanRequestDto = {
    mode,
    goalPrompt: draft.goalPrompt.trim(),
    intensity: draft.intensity ?? 3,
    background: {
      jobPositionTitle: draft.backgroundJobPositionTitle.trim(),
      highestEducationLevel:
        draft.backgroundHighestEducationLevel ?? "OTHER",
      summary: draft.backgroundSummary.trim(),
      company: normalizeOptionalString(draft.backgroundCompany),
      educationText: normalizeOptionalString(draft.backgroundEducationText),
    },
    category: normalizeOptionalString(draft.category),
    level: draft.level ?? undefined,
  };

  if (mode === "SOURCE_FOCUSED") {
    payload.source = {
      type: draft.sourceType ?? "WEB",
      title: draft.sourceTitle.trim(),
      uri: draft.sourceUri.trim(),
    };
  }

  return payload;
}

function normalizeOptionalString(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
