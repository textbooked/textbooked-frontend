import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>{label}</span>
      </CardContent>
    </Card>
  );
}
