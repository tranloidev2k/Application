export const EVENT_CATEGORIES = [
  "work",
  "meeting",
  "study",
  "personal",
  "other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const DEFAULT_CATEGORY: EventCategory = "work";

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  work: "Work",
  meeting: "Meeting",
  study: "Study",
  personal: "Personal",
  other: "Other",
};

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  start: Date;
  end: Date;
}

export type EventDraft = Omit<CalendarEvent, "id">;

export function isEventCategory(value: unknown): value is EventCategory {
  return (EVENT_CATEGORIES as readonly unknown[]).includes(value);
}
