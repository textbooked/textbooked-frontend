import { RewritePlaceholder } from "@/app/(app)/components/rewrite-placeholder";

type TocNodePageProps = {
  nodeId: string;
};

export function TocNodePage({ nodeId }: TocNodePageProps) {
  return (
    <RewritePlaceholder
      title="ToC Node"
      subtitle={<span>Node id: <span className="font-mono">{nodeId}</span></span>}
      cardTitle="Unavailable During Backend Rewrite"
      cardDescription="Node-level material generation and grading are disabled until backend APIs are restored."
      backHref="/"
    />
  );
}
