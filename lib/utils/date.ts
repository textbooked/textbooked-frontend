import {
  format,
  formatISO,
  parseISO,
  startOfWeek,
} from "date-fns";

import type { PlanItem } from "@/lib/api/models";

export type GroupedPlanItems = Array<{
  weekKey: string;
  weekLabel: string;
  dates: Array<{
    dateKey: string;
    dateLabel: string;
    items: PlanItem[];
  }>;
}>;

export function formatDateTime(value: string): string {
  return format(parseISO(value), "MMM d, yyyy p");
}

export function formatDate(value: string): string {
  return format(parseISO(value), "MMM d, yyyy");
}

export function todayIsoDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function groupPlanItemsByWeek(items: PlanItem[]): GroupedPlanItems {
  const byWeek = new Map<string, GroupedPlanItems[number]>();

  for (const item of items) {
    const itemDate = parseISO(item.date);
    const weekStart = startOfWeek(itemDate, { weekStartsOn: 1 });
    const weekKey = formatISO(weekStart, { representation: "date" });

    if (!byWeek.has(weekKey)) {
      byWeek.set(weekKey, {
        weekKey,
        weekLabel: `Week of ${format(weekStart, "MMM d, yyyy")}`,
        dates: [],
      });
    }

    const week = byWeek.get(weekKey);
    if (!week) {
      continue;
    }

    const dateKey = formatISO(itemDate, { representation: "date" });
    let dateGroup = week.dates.find((entry) => entry.dateKey === dateKey);

    if (!dateGroup) {
      dateGroup = {
        dateKey,
        dateLabel: format(itemDate, "EEE, MMM d"),
        items: [],
      };
      week.dates.push(dateGroup);
    }

    dateGroup.items.push(item);
  }

  return [...byWeek.values()]
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
    .map((week) => ({
      ...week,
      dates: [...week.dates].sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    }));
}
