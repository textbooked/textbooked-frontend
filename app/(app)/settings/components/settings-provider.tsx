"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getDefaultSettingsState } from "@/lib/settings/config";
import { readSettingsFromStorage, writeSettingsToStorage } from "@/lib/settings/storage";
import type { LocalSettingsState, SettingsSectionId } from "@/lib/settings/types";

type SectionPatch<K extends SettingsSectionId> =
  | Partial<LocalSettingsState[K]>
  | ((current: LocalSettingsState[K]) => LocalSettingsState[K]);

type SettingsContextValue = {
  settings: LocalSettingsState;
  isHydrated: boolean;
  updateSection: <K extends SettingsSectionId>(section: K, patch: SectionPatch<K>) => void;
  resetSection: (section: SettingsSectionId) => void;
  resetAll: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<LocalSettingsState>(() => readSettingsFromStorage());
  const isHydrated = true;

  const updateSection = useCallback(
    <K extends SettingsSectionId>(section: K, patch: SectionPatch<K>) => {
      setSettings((currentState) => {
        const currentSection = currentState[section];
        const nextSection =
          typeof patch === "function"
            ? patch(currentSection)
            : ({ ...currentSection, ...patch } as LocalSettingsState[K]);

        const nextState = {
          ...currentState,
          [section]: nextSection,
        } as LocalSettingsState;

        writeSettingsToStorage(nextState);
        return nextState;
      });
    },
    [],
  );

  const resetSection = useCallback((section: SettingsSectionId) => {
    const defaults = getDefaultSettingsState();

    setSettings((currentState) => {
      const nextState = {
        ...currentState,
        [section]: defaults[section],
      } as LocalSettingsState;

      writeSettingsToStorage(nextState);
      return nextState;
    });
  }, []);

  const resetAll = useCallback(() => {
    const nextState = getDefaultSettingsState();
    setSettings(nextState);
    writeSettingsToStorage(nextState);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isHydrated,
      updateSection,
      resetSection,
      resetAll,
    }),
    [isHydrated, resetAll, resetSection, settings, updateSection],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider.");
  }

  return context;
}
