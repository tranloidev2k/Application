import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent, EventDraft } from "../types/event";
import * as api from "../api/events";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(events);

  useEffect(() => {
    latest.current = events;
  }, [events]);

  useEffect(() => {
    let cancelled = false;
    api
      .fetchEvents()
      .then(
        (items) => {
          if (!cancelled) setEvents(items);
        },
        (e) => {
          if (!cancelled) setError(errorMessage(e));
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-syncs with the server after a failed write; keeps the write's error.
  const resync = useCallback(async () => {
    try {
      setEvents(await api.fetchEvents());
      return true;
    } catch {
      // The original error is already shown.
      return false;
    }
  }, []);

  // Applies the change locally first, then restores server state (or the
  // previous local state when the server is unreachable) if the request
  // fails, so the calendar never shows data that was not saved.
  const optimistic = useCallback(
    async (
      apply: (items: CalendarEvent[]) => CalendarEvent[],
      persist: () => Promise<unknown>,
    ) => {
      const previous = latest.current;
      setEvents(apply);
      try {
        await persist();
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
        if (!(await resync())) setEvents(previous);
      }
    },
    [resync],
  );

  const create = useCallback(async (draft: EventDraft) => {
    try {
      const created = await api.createEvent(draft);
      setEvents((items) => [...items, created]);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const update = useCallback(
    (id: string, draft: EventDraft) =>
      optimistic(
        (items) => items.map((e) => (e.id === id ? { ...draft, id } : e)),
        () => api.updateEvent(id, draft),
      ),
    [optimistic],
  );

  const move = useCallback(
    (id: string, start: Date, end: Date) => {
      const current = events.find((e) => e.id === id);
      if (!current) return Promise.resolve();
      const { title, description, category } = current;
      return update(id, { title, description, category, start, end });
    },
    [events, update],
  );

  const remove = useCallback(
    (id: string) =>
      optimistic(
        (items) => items.filter((e) => e.id !== id),
        () => api.deleteEvent(id),
      ),
    [optimistic],
  );

  const dismissError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      events,
      loading,
      error,
      create,
      update,
      move,
      remove,
      dismissError,
    }),
    [events, loading, error, create, update, move, remove, dismissError],
  );
}
