import { PlanViewPage } from "./components/plan-view-page";

type PageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { planId } = await params;
  return <PlanViewPage planId={planId} />;
}
