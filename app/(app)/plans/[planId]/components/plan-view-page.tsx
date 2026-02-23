import { RewritePlaceholder } from "@/app/(app)/components/rewrite-placeholder";

type PlanViewPageProps = {
  planId: string;
};

export function PlanViewPage({ planId }: PlanViewPageProps) {
  return (
    <RewritePlaceholder
      title="Plan View"
      subtitle={<span>Plan id: <span className="font-mono">{planId}</span></span>}
      cardTitle="Unavailable During Backend Rewrite"
      cardDescription="Plan endpoints are not wired while backend services are being rebuilt."
      backHref="/"
    />
  );
}
