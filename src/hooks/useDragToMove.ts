import { useCallback, useRef, useState } from "react";
import type { CalendarEvent } from "../types/event";
import { MINUTES_PER_DAY } from "../constants";
import {
  addMinutes,
  clamp,
  dateAtMinutes,
  durationMinutes,
  snapMinutes,
} from "../utils/time";
import { pixelsToMinutes } from "../utils/layout";

export interface MovePreview {
  event: CalendarEvent;
  start: Date;
  end: Date;
}

export function useDragToMove() {
  const active = useRef<{
    event: CalendarEvent;
    grabOffsetPixels: number;
  } | null>(null);
  const previewRef = useRef<MovePreview | null>(null);
  const [preview, setPreviewState] = useState<MovePreview | null>(null);
  const setPreview = useCallback((next: MovePreview | null) => {
    previewRef.current = next;
    setPreviewState(next);
  }, []);

  const begin = useCallback(
    (event: CalendarEvent, pointerY: number, eventTop: number) => {
      active.current = { event, grabOffsetPixels: pointerY - eventTop };
      setPreview({ event, start: event.start, end: event.end });
    },
    [setPreview],
  );
  const update = useCallback(
    (day: Date, pointerY: number, columnTop: number) => {
      if (!active.current) return;
      const { event, grabOffsetPixels } = active.current;
      const duration = durationMinutes(event.start, event.end);
      const minute = snapMinutes(
        pixelsToMinutes(pointerY - columnTop - grabOffsetPixels),
      );
      const latestStart = Math.max(0, MINUTES_PER_DAY - duration);
      const start = dateAtMinutes(day, clamp(minute, 0, latestStart));
      setPreview({ event, start, end: addMinutes(start, duration) });
    },
    [setPreview],
  );

  const finish = useCallback(() => {
    const result = previewRef.current;
    active.current = null;
    setPreview(null);
    return result;
  }, [setPreview]);

  const cancel = useCallback(() => {
    active.current = null;
    setPreview(null);
  }, [setPreview]);

  return { preview, begin, update, finish, cancel };
}
