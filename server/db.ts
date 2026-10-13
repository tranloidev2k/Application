import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type { EventCategory } from "../src/types/event";

export interface StoredEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  start: string;
  end: string;
}

export type StoredEventDraft = Omit<StoredEvent, "id">;

export interface EventStore {
  list: () => StoredEvent[];
  get: (id: string) => StoredEvent | undefined;
  create: (draft: StoredEventDraft) => StoredEvent;
  update: (id: string, draft: StoredEventDraft) => StoredEvent | undefined;
  remove: (id: string) => boolean;
  close: () => void;
}

type Row = Omit<StoredEvent, "start" | "end"> & {
  start_at: string;
  end_at: string;
};

const toEvent = (row: Row): StoredEvent => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  start: row.start_at,
  end: row.end_at,
});

export function createEventStore(path: string): EventStore {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'work',
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS events_start_at ON events (start_at);
  `);

  const selectAll = db.prepare("SELECT * FROM events ORDER BY start_at");
  const selectOne = db.prepare("SELECT * FROM events WHERE id = ?");
  const insert = db.prepare(
    "INSERT INTO events (id, title, description, category, start_at, end_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const replace = db.prepare(
    "UPDATE events SET title = ?, description = ?, category = ?, start_at = ?, end_at = ? WHERE id = ?",
  );
  const destroy = db.prepare("DELETE FROM events WHERE id = ?");

  const get = (id: string) => {
    const row = selectOne.get(id) as Row | undefined;
    return row && toEvent(row);
  };

  return {
    list: () => (selectAll.all() as Row[]).map(toEvent),
    get,
    create: (draft) => {
      const id = randomUUID();
      insert.run(
        id,
        draft.title,
        draft.description,
        draft.category,
        draft.start,
        draft.end,
      );
      return { ...draft, id };
    },
    update: (id, draft) => {
      const { changes } = replace.run(
        draft.title,
        draft.description,
        draft.category,
        draft.start,
        draft.end,
        id,
      );
      return changes ? { ...draft, id } : undefined;
    },
    remove: (id) => destroy.run(id).changes > 0,
    close: () => db.close(),
  };
}
