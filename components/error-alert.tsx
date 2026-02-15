import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorAlertProps = {
  title?: string;
  message: string;
  action?: ReactNode;
};

export function ErrorAlert({
  title = "Something went wrong",
  message,
  action,
}: ErrorAlertProps) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
  );
}
