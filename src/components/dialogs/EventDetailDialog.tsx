import type { CalendarEvent } from "../../types/event";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { formatDate, formatTime } from "../../utils/time";

interface Props {
  event: CalendarEvent;
  onClose: () => void;
}

export function EventDetailDialog({ event, onClose }: Props) {
  useEscapeKey(onClose);

  const formatDateTime = (date: Date) =>
    `${formatDate(date)} · ${formatTime(date)}`;

  const timeRange = `${formatDateTime(event.start)} – ${formatDateTime(event.end)}`;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-title"
        className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#24252a] p-5 text-zinc-100 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="event-detail-title"
            title={event.title}
            className="truncate text-lg font-semibold"
          >
            {event.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-xl leading-none text-zinc-400 hover:bg-zinc-700 hover:text-white"
          >
            &times;
          </button>
        </div>

        <p
          title={event.description || "No description provided."}
          className="mt-4 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-zinc-400"
        >
          {event.description || "No description provided."}
        </p>

        <p
          title={timeRange}
          className="mt-5 truncate text-sm font-normal leading-6 text-zinc-400"
        >
          {timeRange}
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-600"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
