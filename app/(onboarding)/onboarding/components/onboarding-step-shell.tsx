import { ArrowLeft, DoorOpen, SkipForward } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OnboardingStepShellProps = {
  step: number;
  totalSteps: number;
  question: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  canGoBack: boolean;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onExit: () => void;
  isNextLoading?: boolean;
};

export function OnboardingStepShell({
  step,
  totalSteps,
  question,
  hint,
  error,
  children,
  canGoBack,
  nextLabel,
  onBack,
  onNext,
  onSkip,
  onExit,
  isNextLoading,
}: OnboardingStepShellProps) {
  return (
    <Card className="w-full border-border/80 bg-gradient-to-b from-background to-muted/20 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onSkip}>
              <SkipForward className="size-4" />
              Skip for now
            </Button>
            <Button size="sm" variant="ghost" onClick={onExit}>
              <DoorOpen className="size-4" />
              Exit
            </Button>
          </div>
        </div>
        <CardTitle className="text-xl sm:text-2xl">{question}</CardTitle>
        {hint ? <CardDescription>{hint}</CardDescription> : null}
      </CardHeader>

      <CardContent className="space-y-4">{children}</CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-5">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack || isNextLoading}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="text-right">
          {error ? (
            <p className="mb-2 text-sm font-medium text-destructive">{error}</p>
          ) : null}
          <Button onClick={onNext} disabled={isNextLoading}>
            {isNextLoading ? "Working..." : nextLabel}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
