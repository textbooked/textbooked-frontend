import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewBookPage() {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Add Textbook</h1>
        <p className="text-sm text-muted-foreground">
          This flow is paused until backend services are rebuilt.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temporarily Unavailable</CardTitle>
          <CardDescription>
            Intake and creation endpoints were removed during backend rewrite.
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
