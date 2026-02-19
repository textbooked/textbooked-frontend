import { TocNodePage } from "./components/toc-node-page";

type PageProps = {
  params: Promise<{
    nodeId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { nodeId } = await params;
  return <TocNodePage nodeId={nodeId} />;
}
