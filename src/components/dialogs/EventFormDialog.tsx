import { useState } from "react";
import {
  CATEGORY_LABELS,
  EVENT_CATEGORIES,
  isEventCategory,
} from "../../types/event";
import type { CalendarEvent, EventDraft } from "../../types/event";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { inputDateTime } from "../../utils/time";

interface BaseProps {
  onSave: (draft: EventDraft) => void;
  onClose: () => void;
}
type Props = BaseProps &
  (
    | { event: CalendarEvent; initial?: never }
    | { event?: never; initial: EventDraft }
  );

export function EventFormDialog({ event, initial, onSave, onClose }: Props) {
  const source: CalendarEvent | EventDraft = event ?? initial;
  const [title, setTitle] = useState(source.title);
  const [description, setDescription] = useState(source.description);
  const [category, setCategory] = useState(source.category);
  const [start, setStart] = useState(inputDateTime(source.start));
  const [end, setEnd] = useState(inputDateTime(source.end));
  const [error, setError] = useState("");

  useEscapeKey(onClose);

  const submit = () => {
    const parsedStart = new Date(start);
    const parsedEnd = new Date(end);
    if (!title.trim()) return setError("Please enter a title.");
    if (
      Number.isNaN(parsedStart.getTime()) ||
      Number.isNaN(parsedEnd.getTime()) ||
      parsedEnd <= parsedStart
    )
      return setError("End time must be after the start time.");
    onSave({
      title: title.trim(),
      description,
      category,
      start: parsedStart,
      end: parsedEnd,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#24252a] p-6 text-zinc-100 shadow-2xl"
      >
        <h2 id="event-form-title" className="text-lg font-bold">
          {event ? "Edit event" : "Create event"}
        </h2>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">
            Title
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-600 bg-[#17181b] px-3 py-2 outline-none focus:border-[#a8c7fa]"
            />
          </label>
          <label className="block text-sm font-medium">
            Category
            <select
              value={category}
              onChange={(e) => {
                if (isEventCategory(e.target.value))
                  setCategory(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-zinc-600 bg-[#17181b] px-3 py-2 outline-none focus:border-[#a8c7fa]"
            >
              {EVENT_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-zinc-600 bg-[#17181b] px-3 py-2 outline-none focus:border-[#a8c7fa]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Starts
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="calendar-date-input mt-1 w-full rounded-md border border-zinc-600 bg-[#17181b] px-2 py-2 text-xs"
              />
            </label>
            <label className="block text-sm font-medium">
              Ends
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="calendar-date-input mt-1 w-full rounded-md border border-zinc-600 bg-[#17181b] px-2 py-2 text-xs"
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-400">
              {error}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-[#a8c7fa] px-4 py-2 text-sm font-bold text-[#17365d] hover:bg-[#c2d9ff]"
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
