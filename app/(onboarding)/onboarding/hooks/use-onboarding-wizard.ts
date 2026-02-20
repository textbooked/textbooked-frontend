"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getTextbookedBackendAPI } from "@/lib/api/endpoints/core-client-axios";

import {
  createDefaultOnboardingDraft,
  ONBOARDING_DRAFT_STORAGE_KEY,
  ONBOARDING_SKIP_STORAGE_KEY,
  toCreatePlanPayload,
  type OnboardingStepId,
  type OnboardingWizardApi,
  type OnboardingWizardDraft,
} from "../types";

const ONBOARDING_STEPS: OnboardingStepId[] = [
  "mode",
  "goal-or-source",
  "intensity",
  "background",
  "review",
];

export function useOnboardingWizard(): OnboardingWizardApi {
  const router = useRouter();
  const apiRef = useRef(getTextbookedBackendAPI());

  const [draft, setDraft] = useState<OnboardingWizardDraft>(
    createDefaultOnboardingDraft(),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedDraft = readStoredDraft();
    if (storedDraft) {
      setDraft(storedDraft);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    writeDraft(draft);
  }, [draft, isHydrated]);

  const setMode = useCallback((value: NonNullable<OnboardingWizardDraft["mode"]>) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      mode: value,
    }));
    setErrorMessage(null);
  }, []);

  const setGoalPrompt = useCallback((value: string) => {
    setDraft((previousDraft) => ({ ...previousDraft, goalPrompt: value }));
    setErrorMessage(null);
  }, []);

  const setCategory = useCallback((value: string) => {
    setDraft((previousDraft) => ({ ...previousDraft, category: value }));
    setErrorMessage(null);
  }, []);

  const setLevel = useCallback((value: OnboardingWizardDraft["level"]) => {
    setDraft((previousDraft) => ({ ...previousDraft, level: value }));
    setErrorMessage(null);
  }, []);

  const setIntensity = useCallback((value: number) => {
    setDraft((previousDraft) => ({ ...previousDraft, intensity: value }));
    setErrorMessage(null);
  }, []);

  const setSourceType = useCallback((value: OnboardingWizardDraft["sourceType"]) => {
    setDraft((previousDraft) => ({ ...previousDraft, sourceType: value }));
    setErrorMessage(null);
  }, []);

  const setSourceTitle = useCallback((value: string) => {
    setDraft((previousDraft) => ({ ...previousDraft, sourceTitle: value }));
    setErrorMessage(null);
  }, []);

  const setSourceUri = useCallback((value: string) => {
    setDraft((previousDraft) => ({ ...previousDraft, sourceUri: value }));
    setErrorMessage(null);
  }, []);

  const setBackgroundJobPositionTitle = useCallback((value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      backgroundJobPositionTitle: value,
    }));
    setErrorMessage(null);
  }, []);

  const setBackgroundHighestEducationLevel = useCallback(
    (value: OnboardingWizardDraft["backgroundHighestEducationLevel"]) => {
      setDraft((previousDraft) => ({
        ...previousDraft,
        backgroundHighestEducationLevel: value,
      }));
      setErrorMessage(null);
    },
    [],
  );

  const setBackgroundSummary = useCallback((value: string) => {
    setDraft((previousDraft) => ({ ...previousDraft, backgroundSummary: value }));
    setErrorMessage(null);
  }, []);

  const setBackgroundCompany = useCallback((value: string) => {
    setDraft((previousDraft) => ({ ...previousDraft, backgroundCompany: value }));
    setErrorMessage(null);
  }, []);

  const setBackgroundEducationText = useCallback((value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      backgroundEducationText: value,
    }));
    setErrorMessage(null);
  }, []);

  const goBack = useCallback(() => {
    setErrorMessage(null);
    setCurrentStepIndex((previousStep) => Math.max(0, previousStep - 1));
  }, []);

  const goNext = useCallback(() => {
    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    const validationMessage = validateStep(currentStep, draft);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setErrorMessage(null);
    setCurrentStepIndex((previousStep) =>
      Math.min(ONBOARDING_STEPS.length - 1, previousStep + 1),
    );
  }, [currentStepIndex, draft]);

  const skipForNow = useCallback(() => {
    localStorage.setItem(ONBOARDING_SKIP_STORAGE_KEY, "1");
    localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    toast.message("Onboarding skipped for now.");
    router.push("/");
  }, [router]);

  const exitOnboarding = useCallback(() => {
    writeDraft(draft);
    router.push("/");
  }, [draft, router]);

  const submit = useCallback(async () => {
    const validationSteps: OnboardingStepId[] = [
      "mode",
      "goal-or-source",
      "intensity",
      "background",
    ];
    for (const step of validationSteps) {
      const validationMessage = validateStep(step, draft);
      if (validationMessage) {
        setErrorMessage(validationMessage);
        return;
      }
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = toCreatePlanPayload(draft);
      const result = await apiRef.current.onboardingCreateStudyPlan(payload);

      localStorage.removeItem(ONBOARDING_SKIP_STORAGE_KEY);
      localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);

      toast.success("Study plan created.");
      router.push(`/plans/${result.studyPlanId}`);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, router]);

  return {
    state: useMemo(
      () => ({
        draft,
        currentStepIndex,
        steps: ONBOARDING_STEPS,
        errorMessage,
        isSubmitting,
      }),
      [currentStepIndex, draft, errorMessage, isSubmitting],
    ),
    setMode,
    setGoalPrompt,
    setCategory,
    setLevel,
    setIntensity,
    setSourceType,
    setSourceTitle,
    setSourceUri,
    setBackgroundJobPositionTitle,
    setBackgroundHighestEducationLevel,
    setBackgroundSummary,
    setBackgroundCompany,
    setBackgroundEducationText,
    goBack,
    goNext,
    skipForNow,
    exitOnboarding,
    submit,
  };
}

function validateStep(step: OnboardingStepId, draft: OnboardingWizardDraft): string | null {
  if (step === "mode") {
    if (!draft.mode) {
      return "Select how you want to build your plan.";
    }
    return null;
  }

  if (step === "goal-or-source") {
    if (!draft.goalPrompt.trim()) {
      return "Describe what you want to learn.";
    }

    if (draft.mode === "SOURCE_FOCUSED") {
      if (!draft.sourceType) {
        return "Select the source type.";
      }
      if (!draft.sourceTitle.trim()) {
        return "Add a source title.";
      }
      if (!draft.sourceUri.trim()) {
        return "Add a source URL.";
      }
      if (!isValidUrl(draft.sourceUri.trim())) {
        return "Please provide a valid source URL.";
      }
    }

    return null;
  }

  if (step === "intensity") {
    if (!draft.intensity || draft.intensity < 1 || draft.intensity > 5) {
      return "Choose an intensity from 1 to 5.";
    }

    return null;
  }

  if (step === "background") {
    if (!draft.backgroundJobPositionTitle.trim()) {
      return "Add your current role.";
    }
    if (!draft.backgroundHighestEducationLevel) {
      return "Select your highest education level.";
    }
    if (!draft.backgroundSummary.trim()) {
      return "Add a short background summary.";
    }

    return null;
  }

  return null;
}

function readStoredDraft(): OnboardingWizardDraft | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<OnboardingWizardDraft>;
    return {
      ...createDefaultOnboardingDraft(),
      ...parsed,
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: OnboardingWizardDraft): void {
  try {
    localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage errors for private-mode or restricted environments.
  }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    const payload = maybeResponse?.data;

    if (typeof payload === "object" && payload !== null && "message" in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
      if (Array.isArray(message)) {
        return message.filter((entry) => typeof entry === "string").join(", ");
      }
    }
  }

  return "Could not create study plan. Please try again.";
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
