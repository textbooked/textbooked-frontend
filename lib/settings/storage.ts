import { SETTINGS_STORAGE_KEY, getDefaultSettingsState } from "@/lib/settings/config";
import type {
  LocalSettingsState,
  PreferredAnswerDraftMode,
  WeekStart,
  WorkspaceViewPreference,
} from "@/lib/settings/types";

const WEEK_START_OPTIONS: WeekStart[] = ["monday", "sunday"];
const WORKSPACE_VIEW_OPTIONS: WorkspaceViewPreference[] = ["plan", "overview", "toc"];
const ANSWER_DRAFT_MODE_OPTIONS: PreferredAnswerDraftMode[] = ["short", "detailed"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringValue(value: unknown, fallback: string, maxLength = 200): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.slice(0, maxLength);
}

function toNumberValue(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "boolean") {
    return fallback;
  }

  return value;
}

function toEnumValue<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  if (typeof value === "string" && options.includes(value as T)) {
    return value as T;
  }

  return fallback;
}

export function mergeWithDefaults(partialState: unknown): LocalSettingsState {
  const defaults = getDefaultSettingsState();
  const state = isRecord(partialState) ? partialState : {};

  const account = isRecord(state.account) ? state.account : {};
  const plans = isRecord(state.plans) ? state.plans : {};
  const billing = isRecord(state.billing) ? state.billing : {};
  const notifications = isRecord(state.notifications) ? state.notifications : {};
  const security = isRecord(state.security) ? state.security : {};
  const study = isRecord(state.study) ? state.study : {};

  return {
    account: {
      displayNameOverride: toStringValue(
        account.displayNameOverride,
        defaults.account.displayNameOverride,
        80,
      ),
      timezone: toStringValue(account.timezone, defaults.account.timezone, 80),
      weekStart: toEnumValue(account.weekStart, WEEK_START_OPTIONS, defaults.account.weekStart),
    },
    plans: {
      defaultSessionsPerWeek: toNumberValue(
        plans.defaultSessionsPerWeek,
        defaults.plans.defaultSessionsPerWeek,
        1,
        14,
      ),
      defaultMinutesPerSession: toNumberValue(
        plans.defaultMinutesPerSession,
        defaults.plans.defaultMinutesPerSession,
        10,
        240,
      ),
      includeReviews: toBooleanValue(plans.includeReviews, defaults.plans.includeReviews),
      includeTests: toBooleanValue(plans.includeTests, defaults.plans.includeTests),
      defaultWorkspaceView: toEnumValue(
        plans.defaultWorkspaceView,
        WORKSPACE_VIEW_OPTIONS,
        defaults.plans.defaultWorkspaceView,
      ),
    },
    billing: {
      planTier: toStringValue(billing.planTier, defaults.billing.planTier, 60),
      renewalDate: toStringValue(billing.renewalDate, defaults.billing.renewalDate, 60),
      paymentMethodLabel: toStringValue(
        billing.paymentMethodLabel,
        defaults.billing.paymentMethodLabel,
        60,
      ),
      invoiceReminders: toBooleanValue(
        billing.invoiceReminders,
        defaults.billing.invoiceReminders,
      ),
      autoReceiptDownload: toBooleanValue(
        billing.autoReceiptDownload,
        defaults.billing.autoReceiptDownload,
      ),
    },
    notifications: {
      dueActivityReminders: toBooleanValue(
        notifications.dueActivityReminders,
        defaults.notifications.dueActivityReminders,
      ),
      weeklyDigest: toBooleanValue(
        notifications.weeklyDigest,
        defaults.notifications.weeklyDigest,
      ),
      assignmentReadyAlerts: toBooleanValue(
        notifications.assignmentReadyAlerts,
        defaults.notifications.assignmentReadyAlerts,
      ),
      paceRiskAlerts: toBooleanValue(
        notifications.paceRiskAlerts,
        defaults.notifications.paceRiskAlerts,
      ),
      productUpdates: toBooleanValue(
        notifications.productUpdates,
        defaults.notifications.productUpdates,
      ),
    },
    security: {
      emailOnNewSignin: toBooleanValue(
        security.emailOnNewSignin,
        defaults.security.emailOnNewSignin,
      ),
      requireReauthSensitiveActions: toBooleanValue(
        security.requireReauthSensitiveActions,
        defaults.security.requireReauthSensitiveActions,
      ),
      lastSigninDevice: toStringValue(
        security.lastSigninDevice,
        defaults.security.lastSigninDevice,
        120,
      ),
      lastSigninAt: toStringValue(security.lastSigninAt, defaults.security.lastSigninAt, 120),
    },
    study: {
      compactActivityRows: toBooleanValue(
        study.compactActivityRows,
        defaults.study.compactActivityRows,
      ),
      showCompletedActivitiesByDefault: toBooleanValue(
        study.showCompletedActivitiesByDefault,
        defaults.study.showCompletedActivitiesByDefault,
      ),
      autoExpandTocBranches: toBooleanValue(
        study.autoExpandTocBranches,
        defaults.study.autoExpandTocBranches,
      ),
      preferredAnswerDraftMode: toEnumValue(
        study.preferredAnswerDraftMode,
        ANSWER_DRAFT_MODE_OPTIONS,
        defaults.study.preferredAnswerDraftMode,
      ),
    },
  };
}

export function readSettingsFromStorage(): LocalSettingsState {
  if (typeof window === "undefined") {
    return getDefaultSettingsState();
  }

  const rawValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!rawValue) {
    return getDefaultSettingsState();
  }

  try {
    return mergeWithDefaults(JSON.parse(rawValue));
  } catch {
    return getDefaultSettingsState();
  }
}

export function writeSettingsToStorage(state: LocalSettingsState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
}
