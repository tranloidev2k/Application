import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent, EventDraft } from "../types/event";
import { makeId } from "../utils/time";

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const create = useCallback(
    (draft: EventDraft) =>
      setEvents((items) => [...items, { ...draft, id: makeId() }]),
    [],
  );
  const update = useCallback(
    (id: string, draft: EventDraft) =>
      setEvents((items) =>
        items.map((e) => (e.id === id ? { ...draft, id } : e)),
      ),
    [],
  );
  const move = useCallback(
    (id: string, start: Date, end: Date) =>
      setEvents((items) =>
        items.map((e) => (e.id === id ? { ...e, start, end } : e)),
      ),
    [],
  );
  const remove = useCallback(
    (id: string) => setEvents((items) => items.filter((e) => e.id !== id)),
    [],
  );
  return useMemo(
    () => ({ events, create, update, move, remove }),
    [events, create, update, move, remove],
  );
}
