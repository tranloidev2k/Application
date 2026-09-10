import type { CalendarEvent } from "../types/event";
import {
  HOUR_HEIGHT,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  MIN_BLOCK_HEIGHT,
  SNAP_MINUTES,
} from "../constants";
import { clamp, durationMinutes, minutesOfDay, overlaps } from "./time";

export const minutesToPixels = (minutes: number) =>
  (minutes / MINUTES_PER_HOUR) * HOUR_HEIGHT;
export const pixelsToMinutes = (pixels: number) =>
  (pixels / HOUR_HEIGHT) * MINUTES_PER_HOUR;

export interface BlockGeometry {
  top: number;
  height: number;
}

export function blockGeometry(start: Date, end: Date): BlockGeometry {
  const startMinutes = minutesOfDay(start);
  const endMinutes = clamp(
    startMinutes + durationMinutes(start, end),
    startMinutes,
    MINUTES_PER_DAY,
  );
  return {
    top: minutesToPixels(startMinutes),
    height: Math.max(
      MIN_BLOCK_HEIGHT,
      minutesToPixels(Math.max(SNAP_MINUTES, endMinutes - startMinutes)),
    ),
  };
}

export interface EventLayout extends BlockGeometry {
  event: CalendarEvent;
  column: number;
  columns: number;
}

export function layoutEvents(events: CalendarEvent[]): EventLayout[] {
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const groups: CalendarEvent[][] = [];
  for (const event of sorted) {
    const group = groups.find((g) => g.some((other) => overlaps(event, other)));
    if (group) group.push(event);
    else groups.push([event]);
  }
  return groups.flatMap((group) =>
    group.map((event, column) => ({
      event,
      ...blockGeometry(event.start, event.end),
      column,
      columns: group.length,
    })),
  );
}
