import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDragToMove } from "../../../src/hooks/useDragToMove";
import type { CalendarEvent } from "../../../src/types/event";
import { HOUR_HEIGHT } from "../../../src/constants";

const event: CalendarEvent = {
  id: "event-1",
  title: "Focus work",
  description: "",
  start: new Date(2026, 8, 8, 9),
  end: new Date(2026, 8, 8, 10, 30),
};

describe("useDragToMove", () => {
  it("moves an event to another day while preserving its duration", () => {
    const { result } = renderHook(() => useDragToMove());
    const targetDay = new Date(2026, 8, 10);

    act(() =>
      result.current.begin(event, HOUR_HEIGHT * 9 + 20, HOUR_HEIGHT * 9),
    );
    act(() => result.current.update(targetDay, HOUR_HEIGHT * 14 + 20, 0));

    expect(result.current.preview).toMatchObject({
      event,
      start: new Date(2026, 8, 10, 14),
      end: new Date(2026, 8, 10, 15, 30),
    });
  });

  it("keeps an event within the day boundary and clears after cancellation", () => {
    const { result } = renderHook(() => useDragToMove());
    const targetDay = new Date(2026, 8, 10);

    act(() => result.current.begin(event, HOUR_HEIGHT * 9, HOUR_HEIGHT * 9));
    act(() => result.current.update(targetDay, HOUR_HEIGHT * 30, 0));

    expect(result.current.preview?.start).toEqual(
      new Date(2026, 8, 10, 22, 30),
    );
    expect(result.current.preview?.end).toEqual(new Date(2026, 8, 11));

    act(() => result.current.cancel());
    expect(result.current.preview).toBeNull();
  });

  it("does nothing before a move starts and returns the completed preview", () => {
    const { result } = renderHook(() => useDragToMove());

    act(() => result.current.update(new Date(2026, 8, 10), 100, 0));
    expect(result.current.preview).toBeNull();

    act(() => result.current.begin(event, HOUR_HEIGHT * 9, HOUR_HEIGHT * 9));
    let moved: ReturnType<typeof result.current.finish> = null;
    act(() => {
      moved = result.current.finish();
    });
    expect(moved).toMatchObject({ event });
    expect(result.current.preview).toBeNull();
  });
});
