import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsSectionCardProps = {
  title: string;
  description: string;
  onResetSection: () => void;
  onResetAll: () => void;
  children: React.ReactNode;
};

export function SettingsSectionCard({
  title,
  description,
  onResetSection,
  onResetAll,
  children,
}: SettingsSectionCardProps) {
  return (
    <Card className="border-border/80 bg-gradient-to-b from-background to-muted/30 shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <RotateCcw className="size-3" />
              Saved locally on this browser
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={onResetSection}>
              Reset section
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onResetAll}>
              Reset all
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}
