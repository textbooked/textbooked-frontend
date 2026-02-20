"use client";

import { CheckCircle2, Compass, LibraryBig, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EducationLevel, OnboardingLevel, SourceType, StudyPlanMode } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

import { useOnboardingWizard } from "../hooks/use-onboarding-wizard";
import { OnboardingStepShell } from "./onboarding-step-shell";

export function OnboardingWizard() {
  const wizard = useOnboardingWizard();
  const { state } = wizard;
  const currentStep = state.steps[state.currentStepIndex];
  const isReviewStep = currentStep === "review";

  const titleAndHint = getStepTitleAndHint(currentStep, state.draft.mode);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
      <OnboardingStepShell
        step={state.currentStepIndex + 1}
        totalSteps={state.steps.length}
        question={titleAndHint.title}
        hint={titleAndHint.hint}
        error={state.errorMessage}
        canGoBack={state.currentStepIndex > 0}
        onBack={wizard.goBack}
        onSkip={wizard.skipForNow}
        onExit={wizard.exitOnboarding}
        onNext={() => {
          if (isReviewStep) {
            void wizard.submit();
            return;
          }

          wizard.goNext();
        }}
        nextLabel={isReviewStep ? "Create Plan" : "Continue"}
        isNextLoading={state.isSubmitting}
      >
        {currentStep === "mode" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              title="Guided learning"
              description="Describe your goal and let Textbooked curate a focused source set."
              icon={Sparkles}
              selected={state.draft.mode === StudyPlanMode.GUIDED}
              onClick={() => wizard.setMode(StudyPlanMode.GUIDED)}
            />
            <ModeCard
              title="Specific material"
              description="Follow one source end-to-end with a sequential plan."
              icon={LibraryBig}
              selected={state.draft.mode === StudyPlanMode.SOURCE_FOCUSED}
              onClick={() => wizard.setMode(StudyPlanMode.SOURCE_FOCUSED)}
            />
          </div>
        ) : null}

        {currentStep === "goal-or-source" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="goalPrompt">
                Goal prompt
              </label>
              <Textarea
                id="goalPrompt"
                value={state.draft.goalPrompt}
                onChange={(event) => wizard.setGoalPrompt(event.target.value)}
                rows={4}
                placeholder="Example: Learn practical machine learning for production backend services."
              />
            </div>

            {state.draft.mode === StudyPlanMode.SOURCE_FOCUSED ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium" htmlFor="sourceType">
                    Source type
                  </label>
                  <Select
                    value={state.draft.sourceType ?? undefined}
                    onValueChange={(value) =>
                      wizard.setSourceType(value as typeof state.draft.sourceType)
                    }
                  >
                    <SelectTrigger id="sourceType" className="w-full">
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SourceType.BOOK}>Book</SelectItem>
                      <SelectItem value={SourceType.PAPER}>Paper</SelectItem>
                      <SelectItem value={SourceType.VIDEO}>Video</SelectItem>
                      <SelectItem value={SourceType.WEB}>Web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="sourceTitle">
                    Source title
                  </label>
                  <Input
                    id="sourceTitle"
                    value={state.draft.sourceTitle}
                    onChange={(event) => wizard.setSourceTitle(event.target.value)}
                    placeholder="Deep Learning, Chapter 1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="sourceUri">
                    Source URL
                  </label>
                  <Input
                    id="sourceUri"
                    value={state.draft.sourceUri}
                    onChange={(event) => wizard.setSourceUri(event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep === "intensity" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Intensity</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    variant={state.draft.intensity === value ? "default" : "outline"}
                    type="button"
                    onClick={() => wizard.setIntensity(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                1 is relaxed pace, 5 is highly intensive.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="category">
                  Category (optional)
                </label>
                <Input
                  id="category"
                  value={state.draft.category}
                  onChange={(event) => wizard.setCategory(event.target.value)}
                  placeholder="Machine Learning"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="level">
                  Level (optional)
                </label>
                <Select
                  value={state.draft.level ?? undefined}
                  onValueChange={(value) =>
                    wizard.setLevel(value as typeof state.draft.level)
                  }
                >
                  <SelectTrigger id="level" className="w-full">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OnboardingLevel.BEGINNER}>Beginner</SelectItem>
                    <SelectItem value={OnboardingLevel.INTERMEDIATE}>Intermediate</SelectItem>
                    <SelectItem value={OnboardingLevel.ADVANCED}>Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === "background" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="backgroundRole">
                Current role
              </label>
              <Input
                id="backgroundRole"
                value={state.draft.backgroundJobPositionTitle}
                onChange={(event) =>
                  wizard.setBackgroundJobPositionTitle(event.target.value)
                }
                placeholder="Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="backgroundEducation">
                Highest education level
              </label>
              <Select
                value={state.draft.backgroundHighestEducationLevel ?? undefined}
                onValueChange={(value) =>
                  wizard.setBackgroundHighestEducationLevel(
                    value as typeof state.draft.backgroundHighestEducationLevel,
                  )
                }
              >
                <SelectTrigger id="backgroundEducation" className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EducationLevel.SELF_TAUGHT}>Self-taught</SelectItem>
                  <SelectItem value={EducationLevel.BOOTCAMP}>Bootcamp</SelectItem>
                  <SelectItem value={EducationLevel.HIGH_SCHOOL}>High School</SelectItem>
                  <SelectItem value={EducationLevel.UNDERGRAD}>Undergrad</SelectItem>
                  <SelectItem value={EducationLevel.MASTERS}>Masters</SelectItem>
                  <SelectItem value={EducationLevel.PHD}>PhD</SelectItem>
                  <SelectItem value={EducationLevel.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="backgroundCompany">
                Company (optional)
              </label>
              <Input
                id="backgroundCompany"
                value={state.draft.backgroundCompany}
                onChange={(event) => wizard.setBackgroundCompany(event.target.value)}
                placeholder="ACME Corp"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="backgroundEducationText">
                Education context (optional)
              </label>
              <Input
                id="backgroundEducationText"
                value={state.draft.backgroundEducationText}
                onChange={(event) =>
                  wizard.setBackgroundEducationText(event.target.value)
                }
                placeholder="Computer Science"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="backgroundSummary">
                Background summary
              </label>
              <Textarea
                id="backgroundSummary"
                value={state.draft.backgroundSummary}
                onChange={(event) => wizard.setBackgroundSummary(event.target.value)}
                rows={5}
                placeholder="Describe your experience and what kind of outcomes you want."
              />
            </div>
          </div>
        ) : null}

        {currentStep === "review" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
              <p className="text-sm font-medium">Mode</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.draft.mode === StudyPlanMode.SOURCE_FOCUSED
                  ? "Specific material"
                  : "Guided learning"}
              </p>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
              <p className="text-sm font-medium">Goal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.draft.goalPrompt || "Not provided"}
              </p>
            </div>

            {state.draft.mode === StudyPlanMode.SOURCE_FOCUSED ? (
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
                <p className="text-sm font-medium">Source</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.draft.sourceTitle || "Untitled source"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state.draft.sourceUri || "No URL"}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
                <p className="text-sm font-medium">Intensity</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.draft.intensity ?? 3} / 5
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
                <p className="text-sm font-medium">Category / Level</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.draft.category || "Not set"}
                  {state.draft.level ? ` · ${state.draft.level}` : ""}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Profile saved with this plan
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.draft.backgroundJobPositionTitle || "Role not set"} ·{" "}
                {state.draft.backgroundHighestEducationLevel || "Education not set"}
              </p>
            </div>
          </div>
        ) : null}
      </OnboardingStepShell>
    </section>
  );
}

type ModeCardProps = {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon: typeof Compass;
};

function ModeCard({
  title,
  description,
  selected,
  onClick,
  icon: Icon,
}: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border/80 bg-background hover:border-primary/50",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant={selected ? "default" : "secondary"}>{selected ? "Selected" : "Mode"}</Badge>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function getStepTitleAndHint(
  step: string,
  mode: StudyPlanMode | null,
): { title: string; hint?: string } {
  if (step === "mode") {
    return {
      title: "How do you want to build your study plan?",
      hint: "Choose one mode to shape the rest of onboarding.",
    };
  }
  if (step === "goal-or-source") {
    if (mode === StudyPlanMode.SOURCE_FOCUSED) {
      return {
        title: "What material should we follow?",
        hint: "Provide one source URL and describe your goal for this material.",
      };
    }

    return {
      title: "What do you want to learn?",
      hint: "Describe your learning objective clearly and concretely.",
    };
  }
  if (step === "intensity") {
    return {
      title: "How intensive should this plan be?",
      hint: "You can also set optional category and level.",
    };
  }
  if (step === "background") {
    return {
      title: "Tell us your background so we can tailor your plan.",
    };
  }

  return {
    title: "Ready to create your plan?",
    hint: "Review your answers and create your first study plan.",
  };
}
