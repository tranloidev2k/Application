import { useCallback, useRef, useState } from "react";
import { MINUTES_PER_DAY, SNAP_MINUTES } from "../constants";
import { dateAtMinutes, snapMinutes } from "../utils/time";
import { pixelsToMinutes } from "../utils/layout";

export interface CreateSelection {
  day: Date;
  start: number;
  end: number;
}

export function useDragToCreate() {
  const origin = useRef<number | null>(null);
  const previewRef = useRef<CreateSelection | null>(null);
  const [preview, setPreviewState] = useState<CreateSelection | null>(null);
  const setPreview = useCallback((next: CreateSelection | null) => {
    previewRef.current = next;
    setPreviewState(next);
  }, []);
  const begin = useCallback(
    (day: Date, pointerY: number, columnTop: number) => {
      const start = Math.min(
        MINUTES_PER_DAY - SNAP_MINUTES,
        snapMinutes(pixelsToMinutes(pointerY - columnTop)),
      );
      origin.current = start;
      setPreview({ day, start, end: start + SNAP_MINUTES });
    },
    [setPreview],
  );
  const update = useCallback(
    (columnOffsetY: number) => {
      const current = previewRef.current;
      if (origin.current === null || !current) return;
      const pointer = snapMinutes(pixelsToMinutes(columnOffsetY));
      const start = Math.min(origin.current, pointer);
      const end = Math.min(
        MINUTES_PER_DAY,
        Math.max(origin.current + SNAP_MINUTES, pointer),
      );
      setPreview({ ...current, start, end });
    },
    [setPreview],
  );
  const finish = useCallback(() => {
    const result = previewRef.current;
    origin.current = null;
    setPreview(null);
    return result
      ? {
          start: dateAtMinutes(result.day, result.start),
          end: dateAtMinutes(result.day, result.end),
        }
      : null;
  }, [setPreview]);
  const cancel = useCallback(() => {
    origin.current = null;
    setPreview(null);
  }, [setPreview]);
  return { preview, begin, update, finish, cancel };
}
