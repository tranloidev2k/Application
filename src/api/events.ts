import type { CalendarEvent, EventDraft } from "../types/event";
import { ensureSession, getSupabase } from "../lib/supabase";

const TABLE = "calendar_events";
const COLUMNS = "id, title, description, category, start_at, end_at";

export interface EventRow {
  id: string;
  title: string;
  description: string;
  category: CalendarEvent["category"];
  start_at: string;
  end_at: string;
}

export const fromRow = (row: EventRow): CalendarEvent => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  start: new Date(row.start_at),
  end: new Date(row.end_at),
});

export const toRow = (draft: EventDraft) => ({
  title: draft.title,
  description: draft.description,
  category: draft.category,
  start_at: draft.start.toISOString(),
  end_at: draft.end.toISOString(),
});

// Returns the client rather than a query builder: builders are thenable, so
// returning one from an async function would run the query early.
async function db() {
  await ensureSession();
  return getSupabase();
}

export async function fetchEvents() {
  const table = (await db()).from(TABLE);
  const { data, error } = await table.select(COLUMNS).order("start_at");
  if (error) throw new Error(error.message);
  return (data as EventRow[]).map(fromRow);
}

export async function createEvent(draft: EventDraft) {
  const table = (await db()).from(TABLE);
  const { data, error } = await table
    .insert(toRow(draft))
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as EventRow);
}

export async function updateEvent(id: string, draft: EventDraft) {
  const table = (await db()).from(TABLE);
  const { data, error } = await table
    .update(toRow(draft))
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Event not found.");
  return fromRow(data as EventRow);
}

export async function deleteEvent(id: string) {
  const table = (await db()).from(TABLE);
  const { error } = await table.delete().eq("id", id);
  if (error) throw new Error(error.message);
}
