import Link from "next/link";
import { LibraryBig, Sparkles } from "lucide-react";

import { RewritePlaceholder } from "@/app/(app)/components/rewrite-placeholder";
import { Button } from "@/components/ui/button";

export function KnowledgeGraphPage() {
  return (
    <RewritePlaceholder
      title="Knowledge Graph"
      subtitle="See how your sources, sections, and concepts connect over time."
      cardTitle="Knowledge Graph Is Coming Soon"
      cardDescription="We are rebuilding graph views during the backend rewrite so relationships and progress links stay reliable."
      actions={(
        <>
          <Button asChild>
            <Link href="/library">
              <LibraryBig className="size-4" />
              Open Library
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/onboarding">
              <Sparkles className="size-4" />
              Create Study Plan
            </Link>
          </Button>
        </>
      )}
      backHref="/"
      backLabel="Back to Home"
    />
  );
}
