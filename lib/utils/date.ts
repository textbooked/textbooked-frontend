import {
  format,
  formatISO,
  parseISO,
  startOfWeek,
} from "date-fns";

import type { PlanItem, PlanItemType } from "@/lib/api/models";

export type GroupedPlanItems = Array<{
  weekKey: string;
  weekLabel: string;
  dates: Array<{
    dateKey: string;
    dateLabel: string;
    items: PlanItem[];
  }>;
}>;

export type GroupedPlanItemsByWeekAndSection = Array<{
  weekKey: string;
  weekLabel: string;
  sections: Array<{
    sectionId: string;
    sectionTitle: string;
    activities: PlanItem[];
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

export function groupPlanItemsByWeekAndSection(
  items: PlanItem[],
): GroupedPlanItemsByWeekAndSection {
  const sortedItems = [...items].sort(comparePlanItemsByDateThenType);
  const byWeek = new Map<
    string,
    {
      weekKey: string;
      weekLabel: string;
      sectionsById: Map<
        string,
        {
          sectionId: string;
          sectionTitle: string;
          activities: PlanItem[];
        }
      >;
    }
  >();

  for (const item of sortedItems) {
    const itemDate = parseISO(item.date);
    const weekStart = startOfWeek(itemDate, { weekStartsOn: 1 });
    const weekKey = formatISO(weekStart, { representation: "date" });

    if (!byWeek.has(weekKey)) {
      byWeek.set(weekKey, {
        weekKey,
        weekLabel: `Week of ${format(weekStart, "MMM d, yyyy")}`,
        sectionsById: new Map(),
      });
    }

    const week = byWeek.get(weekKey);
    if (!week) {
      continue;
    }

    const existingSection = week.sectionsById.get(item.tocNodeId);
    if (existingSection) {
      existingSection.activities.push(item);
    } else {
      week.sectionsById.set(item.tocNodeId, {
        sectionId: item.tocNodeId,
        sectionTitle: item.tocNode.title,
        activities: [item],
      });
    }
  }

  return [...byWeek.values()]
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
    .map((week) => ({
      weekKey: week.weekKey,
      weekLabel: week.weekLabel,
      sections: [...week.sectionsById.values()]
        .map((section) => ({
          ...section,
          activities: [...section.activities].sort(comparePlanItemsByDateThenType),
        }))
        .filter((section) => section.activities.length > 0),
    }));
}

function comparePlanItemsByDateThenType(a: PlanItem, b: PlanItem): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) {
    return byDate;
  }

  const byType = activityTypeSortOrder(a.type) - activityTypeSortOrder(b.type);
  if (byType !== 0) {
    return byType;
  }

  const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
  if (byCreatedAt !== 0) {
    return byCreatedAt;
  }

  return a.id.localeCompare(b.id);
}

function activityTypeSortOrder(type: PlanItemType): number {
  switch (type) {
    case "READ":
      return 0;
    case "ASSIGNMENT":
      return 1;
    case "REVIEW":
      return 2;
    case "TEST":
      return 3;
    default:
      return 99;
  }
}
