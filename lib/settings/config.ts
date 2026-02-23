import type { LocalSettingsState, SettingsSectionId, SettingsSectionMeta } from "@/lib/settings/types";

export const SETTINGS_STORAGE_KEY = "textbooked-settings-v1";

const SETTINGS_META: Record<SettingsSectionId, SettingsSectionMeta> = {
  account: {
    id: "account",
    label: "Account",
    description: "Profile and personal defaults.",
    href: "/settings/account",
    icon: "user",
  },
  plans: {
    id: "plans",
    label: "Plans",
    description: "Default planning behavior.",
    href: "/settings/plans",
    icon: "calendar",
  },
  billing: {
    id: "billing",
    label: "Billing",
    description: "Plan and payment preferences.",
    href: "/settings/billing",
    icon: "credit-card",
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    description: "Study and product updates.",
    href: "/settings/notifications",
    icon: "bell",
  },
  security: {
    id: "security",
    label: "Security",
    description: "Sign-in safety controls.",
    href: "/settings/security",
    icon: "shield",
  },
  study: {
    id: "study",
    label: "Study Preferences",
    description: "Workspace and study UX defaults.",
    href: "/settings/study",
    icon: "sliders",
  },
};

export const SETTINGS_SECTION_ORDER: SettingsSectionId[] = [
  "account",
  "plans",
  "billing",
  "notifications",
  "security",
  "study",
];

export function getSettingsSectionMeta(sectionId: SettingsSectionId): SettingsSectionMeta {
  return SETTINGS_META[sectionId];
}

export function listSettingsSectionMeta(): SettingsSectionMeta[] {
  return SETTINGS_SECTION_ORDER.map((sectionId) => SETTINGS_META[sectionId]);
}

export function getDefaultSettingsState(): LocalSettingsState {
  return {
    account: {
      displayNameOverride: "",
      timezone: "America/New_York",
      weekStart: "monday",
    },
    plans: {
      defaultSessionsPerWeek: 3,
      defaultMinutesPerSession: 45,
      includeReviews: true,
      includeTests: true,
      defaultWorkspaceView: "plan",
    },
    billing: {
      planTier: "Pro Monthly",
      renewalDate: "March 14, 2026",
      paymentMethodLabel: "Visa •••• 4242",
      invoiceReminders: true,
      autoReceiptDownload: false,
    },
    notifications: {
      dueActivityReminders: true,
      weeklyDigest: true,
      assignmentReadyAlerts: true,
      paceRiskAlerts: true,
      productUpdates: false,
    },
    security: {
      emailOnNewSignin: true,
      requireReauthSensitiveActions: false,
      lastSigninDevice: "MacBook Pro · Chrome",
      lastSigninAt: "Today at 9:41 AM",
    },
    study: {
      compactActivityRows: false,
      showCompletedActivitiesByDefault: true,
      autoExpandTocBranches: false,
      preferredAnswerDraftMode: "detailed",
    },
  };
}
