import { notFound } from "next/navigation";

import { isSettingsSectionId } from "@/lib/settings/types";

import { SettingsSectionContent } from "../components/settings-section-content";

type PageProps = {
  params: Promise<{ section: string }>;
};

export default async function Page({ params }: PageProps) {
  const { section } = await params;

  if (!isSettingsSectionId(section)) {
    notFound();
  }

  return <SettingsSectionContent section={section} />;
}
