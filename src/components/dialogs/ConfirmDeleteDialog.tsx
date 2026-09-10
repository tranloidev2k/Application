import type { CalendarEvent } from "../../types/event";
import { useEscapeKey } from "../../hooks/useEscapeKey";

interface Props {
  event: CalendarEvent;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({ event, onCancel, onConfirm }: Props) {
  useEscapeKey(onCancel);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-event-title"
        className="w-full max-w-sm rounded-xl border border-zinc-700 bg-[#24252a] p-6 text-zinc-100 shadow-2xl"
      >
        <h2 id="delete-event-title" className="text-lg font-bold">
          Delete event?
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          “{event.title}” will be permanently deleted. This action cannot be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400"
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
