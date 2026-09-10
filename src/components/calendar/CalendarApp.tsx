import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent, EventDraft } from "../../types/event";
import { useCalendarEvents } from "../../hooks/useCalendarEvents";
import {
  QUICK_CREATE_MINUTES,
  SNAP_MINUTES,
  VISIBLE_DAYS,
} from "../../constants";
import { addDays, addMinutes, startOfDay } from "../../utils/time";
import { CalendarGrid } from "./CalendarGrid";
import { EventFormDialog } from "../dialogs/EventFormDialog";
import { EventDetailDialog } from "../dialogs/EventDetailDialog";
import { ConfirmDeleteDialog } from "../dialogs/ConfirmDeleteDialog";
import { EventContextMenu } from "../event/EventContextMenu";

type FormState =
  | { mode: "edit"; event: CalendarEvent }
  | { mode: "create"; initial: EventDraft };

export function CalendarApp() {
  const { events, create, update, move, remove } = useCalendarEvents();
  const days = useMemo(
    () =>
      Array.from({ length: VISIBLE_DAYS }, (_, i) =>
        addDays(startOfDay(new Date()), i),
      ),
    [],
  );

  const [form, setForm] = useState<FormState | null>(null);
  const [detail, setDetail] = useState<CalendarEvent | null>(null);
  const [menu, setMenu] = useState<{
    event: CalendarEvent;
    x: number;
    y: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const createFor = useCallback(
    (start: Date, end: Date) =>
      setForm({
        mode: "create",
        initial: { title: "", description: "", start, end },
      }),
    [],
  );

  const openQuickCreate = () => {
    const start = new Date();
    start.setMinutes(
      Math.ceil(start.getMinutes() / SNAP_MINUTES) * SNAP_MINUTES,
      0,
      0,
    );
    createFor(start, addMinutes(start, QUICK_CREATE_MINUTES));
  };

  const save = (draft: EventDraft) => {
    if (form?.mode === "edit") update(form.event.id, draft);
    else create(draft);
    setForm(null);
  };

  const closeForm = () => setForm(null);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0b0b0b] p-4 sm:p-6">
      <section className="mx-auto flex h-full max-w-none flex-col overflow-hidden rounded-2xl bg-[#151515] shadow-2xl shadow-black/40">
        <header className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] px-4 py-3 sm:px-5">
          <h1 className="text-sm font-semibold tracking-wide text-[#e4e4e4]">
            Time Blocking Calendar
          </h1>
          <button
            type="button"
            onClick={openQuickCreate}
            className="rounded-md bg-[#a8c7fa] px-3 py-1.5 text-xs font-bold text-[#17365d] transition-colors hover:bg-[#c2d9ff]"
          >
            + Add event
          </button>
        </header>
        <CalendarGrid
          days={days}
          events={events}
          onCreate={createFor}
          onMove={move}
          onOpen={setDetail}
          onContext={(event, x, y) => setMenu({ event, x, y })}
        />
      </section>
      {form &&
        (form.mode === "edit" ? (
          <EventFormDialog
            event={form.event}
            onSave={save}
            onClose={closeForm}
          />
        ) : (
          <EventFormDialog
            initial={form.initial}
            onSave={save}
            onClose={closeForm}
          />
        ))}
      {detail && (
        <EventDetailDialog event={detail} onClose={() => setDetail(null)} />
      )}
      {menu && (
        <EventContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onEdit={() => {
            setForm({ mode: "edit", event: menu.event });
            setMenu(null);
          }}
          onDelete={() => {
            setDeleteTarget(menu.event);
            setMenu(null);
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog
          event={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            remove(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </main>
  );
}
