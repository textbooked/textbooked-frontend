import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RewritePlaceholder } from "@/app/(app)/components/rewrite-placeholder";

export function LibraryRoutePage() {
  return (
    <RewritePlaceholder
      title="Library"
      subtitle="Manage your sources and material intake from one place."
      cardTitle="Library Flows Are Coming Back"
      cardDescription="Source ingestion and detailed library listing are being reintroduced during backend rewrite."
      actions={(
        <>
          <Button asChild>
            <Link href="/onboarding">
              <Sparkles className="size-4" />
              Start Onboarding
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/books/new">
              <Plus className="size-4" />
              Add Source
            </Link>
          </Button>
        </>
      )}
      backHref="/"
      backLabel="Back to Home"
    />
  );
}
