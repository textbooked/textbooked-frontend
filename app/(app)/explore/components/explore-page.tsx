import Link from "next/link";
import { LibraryBig, Sparkles } from "lucide-react";

import { RewritePlaceholder } from "@/app/(app)/components/rewrite-placeholder";
import { Button } from "@/components/ui/button";

export function ExplorePage() {
  return (
    <RewritePlaceholder
      title="Explore"
      subtitle="Discover new material, topic clusters, and future learning paths."
      cardTitle="Explore Is Coming Soon"
      cardDescription="Exploration and discovery flows are being rebuilt so recommendations stay aligned with your active study work."
      actions={(
        <>
          <Button asChild>
            <Link href="/onboarding">
              <Sparkles className="size-4" />
              Create Study Plan
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/library">
              <LibraryBig className="size-4" />
              Open Library
            </Link>
          </Button>
        </>
      )}
      backHref="/"
      backLabel="Back to Home"
    />
  );
}
