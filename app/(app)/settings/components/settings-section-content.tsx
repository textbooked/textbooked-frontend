"use client";

import { useMemo } from "react";
import { CreditCard, Mail, Shield, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

import { SettingRow } from "./setting-row";
import { SettingsSectionCard } from "./settings-section-card";
import { useSettings } from "./settings-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getSettingsSectionMeta } from "@/lib/settings/config";
import type {
  PreferredAnswerDraftMode,
  SettingsSectionId,
  WeekStart,
  WorkspaceViewPreference,
} from "@/lib/settings/types";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "UTC",
];

type SettingsSectionContentProps = {
  section: SettingsSectionId;
};

export function SettingsSectionContent({ section }: SettingsSectionContentProps) {
  const { data: session } = useSession();
  const { settings, resetAll, resetSection, updateSection } = useSettings();
  const sectionMeta = getSettingsSectionMeta(section);

  const timezoneOptions = useMemo(() => {
    const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const values = [settings.account.timezone, resolvedTimezone, ...COMMON_TIMEZONES].filter(
      (value): value is string => Boolean(value),
    );

    return Array.from(new Set(values));
  }, [settings.account.timezone]);

  const currentName =
    settings.account.displayNameOverride.trim() ||
    session?.user?.name ||
    session?.user?.email ||
    "Textbooked user";

  const currentEmail = session?.user?.email ?? "No email available";

  if (section === "account") {
    return (
      <SettingsSectionCard
        title={sectionMeta.label}
        description="Manage profile defaults and calendar preferences used throughout your study workspace."
        onResetSection={() => resetSection("account")}
        onResetAll={resetAll}
      >
        <div className="grid gap-3 rounded-lg border border-border/80 bg-background/70 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-5" />
          </span>

          <div className="space-y-1">
            <p className="text-sm font-medium">{currentName}</p>
            <p className="text-sm text-muted-foreground">{currentEmail}</p>
          </div>
        </div>

        <SettingRow
          label="Display name override"
          description="If set, this name is shown in local UI labels and headings on this browser."
          htmlFor="displayNameOverride"
          control={
            <Input
              id="displayNameOverride"
              value={settings.account.displayNameOverride}
              onChange={(event) =>
                updateSection("account", { displayNameOverride: event.target.value })
              }
              placeholder="Use account name"
              maxLength={80}
            />
          }
        />

        <SettingRow
          label="Timezone"
          description="Used for local date labels and reminder timing previews."
          control={
            <Select
              value={settings.account.timezone}
              onValueChange={(value) => updateSection("account", { timezone: value })}
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <SettingRow
          label="Week start"
          description="Controls weekly grouping labels across your plan views."
          control={
            <Select
              value={settings.account.weekStart}
              onValueChange={(value) =>
                updateSection("account", { weekStart: value as WeekStart })
              }
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </SettingsSectionCard>
    );
  }

  if (section === "plans") {
    return (
      <SettingsSectionCard
        title={sectionMeta.label}
        description="Define your default planning behavior before backend-based plan templates are connected."
        onResetSection={() => resetSection("plans")}
        onResetAll={resetAll}
      >
        <SettingRow
          label="Default sessions per week"
          description="Applied as a starting point when you generate a new study plan."
          htmlFor="defaultSessionsPerWeek"
          control={
            <Input
              id="defaultSessionsPerWeek"
              type="number"
              min={1}
              max={14}
              value={settings.plans.defaultSessionsPerWeek}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(value)) {
                  updateSection("plans", {
                    defaultSessionsPerWeek: Math.min(14, Math.max(1, value)),
                  });
                }
              }}
              className="w-full sm:w-[120px]"
            />
          }
        />

        <SettingRow
          label="Default minutes per session"
          description="Used as your initial pacing preference when creating plans."
          htmlFor="defaultMinutesPerSession"
          control={
            <Input
              id="defaultMinutesPerSession"
              type="number"
              min={10}
              max={240}
              value={settings.plans.defaultMinutesPerSession}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(value)) {
                  updateSection("plans", {
                    defaultMinutesPerSession: Math.min(240, Math.max(10, value)),
                  });
                }
              }}
              className="w-full sm:w-[120px]"
            />
          }
        />

        <SettingRow
          label="Include review activities"
          description="When enabled, generated plans assume review activities should be included."
          htmlFor="includeReviews"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="includeReviews"
                checked={settings.plans.includeReviews}
                onCheckedChange={(checked) =>
                  updateSection("plans", { includeReviews: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Include test activities"
          description="When enabled, generated plans assume test checkpoints should be included."
          htmlFor="includeTests"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="includeTests"
                checked={settings.plans.includeTests}
                onCheckedChange={(checked) =>
                  updateSection("plans", { includeTests: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Default workspace view"
          description="Determines which mode opens first when entering a book workspace."
          control={
            <Select
              value={settings.plans.defaultWorkspaceView}
              onValueChange={(value) =>
                updateSection("plans", {
                  defaultWorkspaceView: value as WorkspaceViewPreference,
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plan">Plan</SelectItem>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="toc">ToC</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <SettingRow
          label="Restart progress"
          description="Resets pace and progress from a new date. This control is waiting on backend support."
          control={
            <div className="space-y-2">
              <Button type="button" variant="outline" disabled>
                Restart progress
              </Button>
              <p className="text-xs text-muted-foreground">Backend endpoint not connected yet.</p>
            </div>
          }
        />
      </SettingsSectionCard>
    );
  }

  if (section === "billing") {
    return (
      <SettingsSectionCard
        title={sectionMeta.label}
        description="Review your billing snapshot and set local reminders while payment flows are still pending integration."
        onResetSection={() => resetSection("billing")}
        onResetAll={resetAll}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/80 bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
            <p className="mt-1 text-sm font-semibold">{settings.billing.planTier}</p>
          </div>

          <div className="rounded-lg border border-border/80 bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Renewal</p>
            <p className="mt-1 text-sm font-semibold">{settings.billing.renewalDate}</p>
          </div>

          <div className="rounded-lg border border-border/80 bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment</p>
            <p className="mt-1 text-sm font-semibold">{settings.billing.paymentMethodLabel}</p>
          </div>
        </div>

        <SettingRow
          label="Invoice reminders"
          description="Receive local reminder prompts before your billing renewal date."
          htmlFor="invoiceReminders"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="invoiceReminders"
                checked={settings.billing.invoiceReminders}
                onCheckedChange={(checked) =>
                  updateSection("billing", { invoiceReminders: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Auto receipt download"
          description="Automatically collect receipts locally once backend billing webhooks are connected."
          htmlFor="autoReceiptDownload"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="autoReceiptDownload"
                checked={settings.billing.autoReceiptDownload}
                onCheckedChange={(checked) =>
                  updateSection("billing", { autoReceiptDownload: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Billing actions"
          description="Portal actions remain disabled until payment provider integration is connected."
          control={
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled>
                  <CreditCard className="size-4" />
                  Manage plan
                </Button>
                <Button type="button" size="sm" variant="outline" disabled>
                  Update payment method
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Coming soon.</p>
            </div>
          }
        />
      </SettingsSectionCard>
    );
  }

  if (section === "notifications") {
    return (
      <SettingsSectionCard
        title={sectionMeta.label}
        description="Fine-tune the reminders and updates you want to see while studying."
        onResetSection={() => resetSection("notifications")}
        onResetAll={resetAll}
      >
        <SettingRow
          label="Due activity reminders"
          description="Show reminders when planned activities are due soon."
          htmlFor="dueActivityReminders"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="dueActivityReminders"
                checked={settings.notifications.dueActivityReminders}
                onCheckedChange={(checked) =>
                  updateSection("notifications", { dueActivityReminders: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Weekly digest"
          description="Receive a local weekly summary of completed and pending activities."
          htmlFor="weeklyDigest"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="weeklyDigest"
                checked={settings.notifications.weeklyDigest}
                onCheckedChange={(checked) =>
                  updateSection("notifications", { weeklyDigest: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Assignment ready alerts"
          description="Notify when assignment generation becomes available for current sections."
          htmlFor="assignmentReadyAlerts"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="assignmentReadyAlerts"
                checked={settings.notifications.assignmentReadyAlerts}
                onCheckedChange={(checked) =>
                  updateSection("notifications", { assignmentReadyAlerts: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Pace risk alerts"
          description="Warn when your current completion speed falls behind the selected pace."
          htmlFor="paceRiskAlerts"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="paceRiskAlerts"
                checked={settings.notifications.paceRiskAlerts}
                onCheckedChange={(checked) =>
                  updateSection("notifications", { paceRiskAlerts: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Product updates"
          description="Receive release notes and feature updates for Textbooked."
          htmlFor="productUpdates"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="productUpdates"
                checked={settings.notifications.productUpdates}
                onCheckedChange={(checked) =>
                  updateSection("notifications", { productUpdates: checked })
                }
              />
            </div>
          }
        />
      </SettingsSectionCard>
    );
  }

  if (section === "security") {
    return (
      <SettingsSectionCard
        title={sectionMeta.label}
        description="Control basic account protection preferences while server-side security controls are still being wired."
        onResetSection={() => resetSection("security")}
        onResetAll={resetAll}
      >
        <SettingRow
          label="Email on new sign-in"
          description="Get notified when your account signs in from a new browser or device."
          htmlFor="emailOnNewSignin"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="emailOnNewSignin"
                checked={settings.security.emailOnNewSignin}
                onCheckedChange={(checked) =>
                  updateSection("security", { emailOnNewSignin: checked })
                }
              />
            </div>
          }
        />

        <SettingRow
          label="Require re-auth for sensitive actions"
          description="Prompt a fresh sign-in before high-impact account actions."
          htmlFor="requireReauthSensitiveActions"
          control={
            <div className="flex justify-start sm:justify-end">
              <Switch
                id="requireReauthSensitiveActions"
                checked={settings.security.requireReauthSensitiveActions}
                onCheckedChange={(checked) =>
                  updateSection("security", { requireReauthSensitiveActions: checked })
                }
              />
            </div>
          }
        />

        <div className="rounded-lg border border-border/80 bg-background/70 p-4">
          <p className="text-sm font-medium">Session summary</p>
          <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2">
              <Shield className="size-4" />
              {settings.security.lastSigninDevice}
            </p>
            <p className="inline-flex items-center gap-2">
              <Mail className="size-4" />
              {settings.security.lastSigninAt}
            </p>
          </div>
        </div>

        <SettingRow
          label="Global sign-out"
          description="Server endpoint for revoking all active sessions is not connected yet."
          control={
            <div className="space-y-2">
              <Button type="button" variant="outline" disabled>
                Sign out all devices
              </Button>
              <p className="text-xs text-muted-foreground">Coming soon.</p>
            </div>
          }
        />
      </SettingsSectionCard>
    );
  }

  return (
    <SettingsSectionCard
      title={sectionMeta.label}
      description="Set study-focused UI defaults to match how you work through textbook sections."
      onResetSection={() => resetSection("study")}
      onResetAll={resetAll}
    >
      <SettingRow
        label="Compact activity rows"
        description="Use tighter spacing in plan activities for higher information density."
        htmlFor="compactActivityRows"
        control={
          <div className="flex justify-start sm:justify-end">
            <Switch
              id="compactActivityRows"
              checked={settings.study.compactActivityRows}
              onCheckedChange={(checked) =>
                updateSection("study", { compactActivityRows: checked })
              }
            />
          </div>
        }
      />

      <SettingRow
        label="Show completed activities by default"
        description="Keep completed activity rows visible without manually toggling filters."
        htmlFor="showCompletedActivitiesByDefault"
        control={
          <div className="flex justify-start sm:justify-end">
            <Switch
              id="showCompletedActivitiesByDefault"
              checked={settings.study.showCompletedActivitiesByDefault}
              onCheckedChange={(checked) =>
                updateSection("study", { showCompletedActivitiesByDefault: checked })
              }
            />
          </div>
        }
      />

      <SettingRow
        label="Auto-expand ToC branches"
        description="Expand likely active branches automatically when opening the ToC workspace."
        htmlFor="autoExpandTocBranches"
        control={
          <div className="flex justify-start sm:justify-end">
            <Switch
              id="autoExpandTocBranches"
              checked={settings.study.autoExpandTocBranches}
              onCheckedChange={(checked) =>
                updateSection("study", { autoExpandTocBranches: checked })
              }
            />
          </div>
        }
      />

      <SettingRow
        label="Preferred answer drafting mode"
        description="Select your default writing style when preparing assignment answers."
        control={
          <Select
            value={settings.study.preferredAnswerDraftMode}
            onValueChange={(value) =>
              updateSection("study", {
                preferredAnswerDraftMode: value as PreferredAnswerDraftMode,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="rounded-lg border border-border/80 bg-background/70 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Scope note</p>
        <p className="mt-1">
          These controls are local-only today. Backend synchronization can be connected later without changing the UI structure.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">Local only</Badge>
          <Badge variant="secondary">Ready for backend wiring</Badge>
        </div>
      </div>
    </SettingsSectionCard>
  );
}
