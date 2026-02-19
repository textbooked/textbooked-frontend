import { notFound } from "next/navigation";

import { SettingsSectionContent } from "@/components/settings/settings-section-content";
import { isSettingsSectionId } from "@/lib/settings/types";

type SettingsSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function SettingsSectionPage({ params }: SettingsSectionPageProps) {
  const { section } = await params;

  if (!isSettingsSectionId(section)) {
    notFound();
  }

  return <SettingsSectionContent section={section} />;
}
