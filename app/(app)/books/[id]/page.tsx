import { BookWorkspacePage } from "./components/book-workspace-page";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BookWorkspacePage id={id} />;
}
