import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { CalendarEvent } from "../../types/event";
import { useDragToCreate } from "../../hooks/useDragToCreate";
import { useDragToMove } from "../../hooks/useDragToMove";
import { TimeAxis } from "./TimeAxis";
import { DayColumn } from "./DayColumn";
import { DRAG_THRESHOLD_PIXELS } from "../../constants";
import { isSameDay, minutesOfDay } from "../../utils/time";
import { CalendarHeader } from "./CalendarHeader";

interface Props {
  days: Date[];
  events: CalendarEvent[];
  onCreate: (start: Date, end: Date) => void;
  onMove: (id: string, start: Date, end: Date) => void;
  onOpen: (event: CalendarEvent) => void;
  onContext: (event: CalendarEvent, x: number, y: number) => void;
}

type DragKind = "create" | "move" | null;

export function CalendarGrid({
  days,
  events,
  onCreate,
  onMove,
  onOpen,
  onContext,
}: Props) {
  const {
    preview: createPreview,
    begin: beginCreate,
    update: updateCreate,
    finish: finishCreate,
    cancel: cancelCreate,
  } = useDragToCreate();
  const {
    preview: movePreview,
    begin: beginMove,
    update: updateMove,
    finish: finishMove,
    cancel: cancelMove,
  } = useDragToMove();
  const area = useRef<HTMLDivElement>(null);
  const kind = useRef<DragKind>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const pendingMove = useRef<{
    event: CalendarEvent;
    eventTop: number;
  } | null>(null);
  const dragMoveStarted = useRef(false);
  const didDrag = useRef(false);
  const now = new Date();

  const point = useCallback(
    (x: number) => {
      const area_ = area.current;
      if (!area_) return null;
      const columns = Array.from(
        area_.querySelectorAll<HTMLElement>("[data-day-column]"),
      );
      const index = columns.findIndex((c) => {
        const r = c.getBoundingClientRect();
        return x >= r.left && x <= r.right;
      });
      if (index === -1) return null;
      return {
        day: days[index],
        top: columns[index].getBoundingClientRect().top,
      };
    },
    [days],
  );

  const resetDrag = useCallback(() => {
    kind.current = null;
    down.current = null;
    pendingMove.current = null;
    dragMoveStarted.current = false;
  }, []);

  useEffect(() => {
    const onPointerMove = (e: globalThis.PointerEvent) => {
      if (!kind.current) return;
      if (
        down.current &&
        Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) >
          DRAG_THRESHOLD_PIXELS
      ) {
        didDrag.current = true;
      }
      const p = point(e.clientX);
      if (!p) return;
      if (kind.current === "create") updateCreate(e.clientY - p.top);
      else if (didDrag.current) {
        if (!dragMoveStarted.current && pendingMove.current && down.current) {
          beginMove(
            pendingMove.current.event,
            down.current.y,
            pendingMove.current.eventTop,
          );
          dragMoveStarted.current = true;
        }
        updateMove(p.day, e.clientY, p.top);
      }
    };

    const onPointerUp = () => {
      if (kind.current === "create") {
        const value = finishCreate();
        if (value) onCreate(value.start, value.end);
      } else if (kind.current === "move" && dragMoveStarted.current) {
        const value = finishMove();
        if (value) onMove(value.event.id, value.start, value.end);
      }
      resetDrag();
    };

    const abort = () => {
      if (!kind.current) return;
      cancelCreate();
      cancelMove();
      resetDrag();
      didDrag.current = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") abort();
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", abort);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", abort);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    beginMove,
    cancelCreate,
    cancelMove,
    finishCreate,
    finishMove,
    onCreate,
    onMove,
    point,
    resetDrag,
    updateCreate,
    updateMove,
  ]);

  const empty = (e: PointerEvent<HTMLDivElement>, day: Date) => {
    kind.current = "create";
    down.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
    beginCreate(day, e.clientY, e.currentTarget.getBoundingClientRect().top);
  };

  const eventDown = (e: PointerEvent<HTMLDivElement>, event: CalendarEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    kind.current = "move";
    down.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
    pendingMove.current = {
      event,
      eventTop: e.currentTarget.getBoundingClientRect().top,
    };
    dragMoveStarted.current = false;
  };

  const click = (e: MouseEvent<HTMLDivElement>, event: CalendarEvent) => {
    e.stopPropagation();
    if (e.button === 0 && !didDrag.current) onOpen(event);
  };

  return (
    <div className="calendar-scroll relative min-h-0 flex-1 overflow-auto">
      <div className="min-w-[743px]">
        <CalendarHeader days={days} />
        <div ref={area} className="flex w-full">
          <TimeAxis />
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={events}
              preview={movePreview}
              currentMinutes={
                isSameDay(day, now) ? minutesOfDay(now) : undefined
              }
              onEmptyPointerDown={empty}
              onEventPointerDown={eventDown}
              onEventClick={click}
              onEventActivate={onOpen}
              onEventContextMenu={(e, event) => {
                e.preventDefault();
                e.stopPropagation();
                onContext(event, e.clientX, e.clientY);
              }}
            />
          ))}
        </div>
      </div>
      <div aria-live="polite" className="sr-only">
        {createPreview ? "Selecting a time range" : ""}
      </div>
    </div>
  );
}
