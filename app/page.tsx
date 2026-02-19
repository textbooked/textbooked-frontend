import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LibraryPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground">
          Backend services are being rewritten. Library data is temporarily offline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backend Rewrite In Progress</CardTitle>
          <CardDescription>
            API-backed library flows are disabled until the new backend contracts are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/settings">Open Settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/help">Open Support Center</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
