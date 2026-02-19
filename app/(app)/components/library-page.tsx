import Link from "next/link";

import { Button } from "@/components/ui/button";

import { RewritePlaceholder } from "./rewrite-placeholder";

export function LibraryPage() {
  return (
    <RewritePlaceholder
      title="Library"
      subtitle="Backend services are being rewritten. Library data is temporarily offline."
      cardTitle="Backend Rewrite In Progress"
      cardDescription="API-backed library flows are disabled until the new backend contracts are ready."
      actions={(
        <>
          <Button asChild>
            <Link href="/settings">Open Settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/help">Open Support Center</Link>
          </Button>
        </>
      )}
    />
  );
}
