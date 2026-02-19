import type { ReactNode } from "react";

import { SettingsProvider } from "./components/settings-provider";
import { SettingsShell } from "./components/settings-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <SettingsShell>{children}</SettingsShell>
    </SettingsProvider>
  );
}
