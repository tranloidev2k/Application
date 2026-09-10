import type { MouseEvent, PointerEvent } from "react";
import type { CalendarEvent } from "../../types/event";
import type { MovePreview } from "../../hooks/useDragToMove";
import { DAY_HEIGHT, HOUR_HEIGHT } from "../../constants";
import {
  blockGeometry,
  layoutEvents,
  minutesToPixels,
} from "../../utils/layout";
import { isSameDay } from "../../utils/time";
import { EventBlock } from "../event/EventBlock";

interface Props {
  day: Date;
  events: CalendarEvent[];
  preview?: MovePreview | null;
  currentMinutes?: number;
  onEmptyPointerDown: (e: PointerEvent<HTMLDivElement>, day: Date) => void;
  onEventPointerDown: (
    e: PointerEvent<HTMLDivElement>,
    event: CalendarEvent,
  ) => void;
  onEventClick: (e: MouseEvent<HTMLDivElement>, event: CalendarEvent) => void;
  onEventActivate: (event: CalendarEvent) => void;
  onEventContextMenu: (
    e: MouseEvent<HTMLDivElement>,
    event: CalendarEvent,
  ) => void;
}

export function DayColumn({
  day,
  events,
  preview,
  currentMinutes,
  onEmptyPointerDown,
  onEventPointerDown,
  onEventClick,
  onEventActivate,
  onEventContextMenu,
}: Props) {
  const visible = events.filter(
    (e) => isSameDay(e.start, day) && e.id !== preview?.event.id,
  );
  const previewLayout =
    preview && isSameDay(preview.start, day)
      ? {
          event: { ...preview.event, start: preview.start, end: preview.end },
          ...blockGeometry(preview.start, preview.end),
          column: 0,
          columns: 1,
        }
      : null;
  return (
    <div
      data-day-column="true"
      className="relative min-w-[95px] flex-1 border-r border-[#2a2a2a] bg-[#151515] last:border-r-0"
      style={{
        height: DAY_HEIGHT,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 2}px, #202020 ${HOUR_HEIGHT - 1}px, #303030 ${HOUR_HEIGHT}px)`,
      }}
      onPointerDown={(e) => {
        if (e.button === 0 && e.target === e.currentTarget)
          onEmptyPointerDown(e, day);
      }}
    >
      {layoutEvents(visible).map((item) => (
        <EventBlock
          key={item.event.id}
          item={item}
          onPointerDown={(e) => onEventPointerDown(e, item.event)}
          onClick={(e) => onEventClick(e, item.event)}
          onActivate={() => onEventActivate(item.event)}
          onContextMenu={(e) => onEventContextMenu(e, item.event)}
        />
      ))}
      {previewLayout && <EventBlock item={previewLayout} isPreview />}
      {currentMinutes !== undefined && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 h-px w-full bg-[#ea4335]"
          style={{ top: minutesToPixels(currentMinutes) }}
        >
          <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#ea4335]" />
        </div>
      )}
    </div>
  );
}
