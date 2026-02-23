import { RewritePlaceholder } from "@/app/(app)/components/rewrite-placeholder";

export function NewBookPage() {
  return (
    <RewritePlaceholder
      title="Add Textbook"
      subtitle="This flow is paused until backend services are rebuilt."
      cardTitle="Temporarily Unavailable"
      cardDescription="Intake and creation endpoints were removed during backend rewrite."
      backHref="/"
    />
  );
}
