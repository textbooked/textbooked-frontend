import { SettingsShell } from "@/components/settings/settings-shell";
import { SettingsProvider } from "@/components/settings/settings-provider";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <SettingsShell>{children}</SettingsShell>
    </SettingsProvider>
  );
}
