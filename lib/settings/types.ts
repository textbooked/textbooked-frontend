export const SETTINGS_SECTION_IDS = [
  "account",
  "plans",
  "billing",
  "notifications",
  "security",
  "study",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export type WeekStart = "monday" | "sunday";

export type WorkspaceViewPreference = "plan" | "overview" | "toc";

export type PreferredAnswerDraftMode = "short" | "detailed";

export type SettingsSectionIcon =
  | "user"
  | "calendar"
  | "credit-card"
  | "bell"
  | "shield"
  | "sliders";

export type SettingsSectionMeta = {
  id: SettingsSectionId;
  label: string;
  description: string;
  href: `/settings/${SettingsSectionId}`;
  icon: SettingsSectionIcon;
};

export type AccountSettings = {
  displayNameOverride: string;
  timezone: string;
  weekStart: WeekStart;
};

export type PlansSettings = {
  defaultSessionsPerWeek: number;
  defaultMinutesPerSession: number;
  includeReviews: boolean;
  includeTests: boolean;
  defaultWorkspaceView: WorkspaceViewPreference;
};

export type BillingSettings = {
  planTier: string;
  renewalDate: string;
  paymentMethodLabel: string;
  invoiceReminders: boolean;
  autoReceiptDownload: boolean;
};

export type NotificationsSettings = {
  dueActivityReminders: boolean;
  weeklyDigest: boolean;
  assignmentReadyAlerts: boolean;
  paceRiskAlerts: boolean;
  productUpdates: boolean;
};

export type SecuritySettings = {
  emailOnNewSignin: boolean;
  requireReauthSensitiveActions: boolean;
  lastSigninDevice: string;
  lastSigninAt: string;
};

export type StudyPreferencesSettings = {
  compactActivityRows: boolean;
  showCompletedActivitiesByDefault: boolean;
  autoExpandTocBranches: boolean;
  preferredAnswerDraftMode: PreferredAnswerDraftMode;
};

export type LocalSettingsState = {
  account: AccountSettings;
  plans: PlansSettings;
  billing: BillingSettings;
  notifications: NotificationsSettings;
  security: SecuritySettings;
  study: StudyPreferencesSettings;
};

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);
}
