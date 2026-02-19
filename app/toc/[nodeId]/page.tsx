import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TocPageProps = {
  params: Promise<{
    nodeId: string;
  }>;
};

export default async function TocNodePage({ params }: TocPageProps) {
  const { nodeId } = await params;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">ToC Node</h1>
        <p className="text-sm text-muted-foreground">
          Node id: <span className="font-mono">{nodeId}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unavailable During Backend Rewrite</CardTitle>
          <CardDescription>
            Node-level material generation and grading are disabled until backend APIs are restored.
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
