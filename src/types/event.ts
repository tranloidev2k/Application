export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
}

export type EventDraft = Omit<CalendarEvent, "id">;
