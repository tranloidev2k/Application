import type { CalendarEvent, EventDraft } from "../types/event";

const BASE_URL = "/api/events";

interface EventPayload extends Omit<CalendarEvent, "start" | "end"> {
  start: string;
  end: string;
}

const fromPayload = (payload: EventPayload): CalendarEvent => ({
  ...payload,
  start: new Date(payload.start),
  end: new Date(payload.end),
});

const toPayload = (draft: EventDraft) => ({
  ...draft,
  start: draft.start.toISOString(),
  end: draft.end.toISOString(),
});

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Request failed (${res.status}).`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function fetchEvents() {
  const items = await request<EventPayload[]>(BASE_URL);
  return items.map(fromPayload);
}

export async function createEvent(draft: EventDraft) {
  return fromPayload(
    await request<EventPayload>(BASE_URL, {
      method: "POST",
      body: JSON.stringify(toPayload(draft)),
    }),
  );
}

export async function updateEvent(id: string, draft: EventDraft) {
  return fromPayload(
    await request<EventPayload>(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(toPayload(draft)),
    }),
  );
}

export function deleteEvent(id: string) {
  return request<void>(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
