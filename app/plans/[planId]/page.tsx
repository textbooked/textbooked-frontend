import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlanPageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function PlanPage({ params }: PlanPageProps) {
  const { planId } = await params;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Plan View</h1>
        <p className="text-sm text-muted-foreground">
          Plan id: <span className="font-mono">{planId}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unavailable During Backend Rewrite</CardTitle>
          <CardDescription>
            Plan endpoints are not wired while backend services are being rebuilt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/">Back to Library</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
