import { RewritePlaceholder } from "@/app/(app)/components/rewrite-placeholder";

type BookWorkspacePageProps = {
  id: string;
};

export function BookWorkspacePage({ id }: BookWorkspacePageProps) {
  return (
    <RewritePlaceholder
      title="Book Workspace"
      subtitle={<span>Book id: <span className="font-mono">{id}</span></span>}
      cardTitle="Workspace Paused"
      cardDescription="Plan, overview, and ToC interactions are disabled until the backend rewrite is complete."
      backHref="/"
    />
  );
}
