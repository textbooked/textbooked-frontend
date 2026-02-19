import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Book Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Book id: <span className="font-mono">{id}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Paused</CardTitle>
          <CardDescription>
            Plan, overview, and ToC interactions are disabled until the backend rewrite is complete.
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
