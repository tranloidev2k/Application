import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EventDraft } from "../../../src/types/event";
import { useCalendarEvents } from "../../../src/hooks/useCalendarEvents";

const draft = (title = "Planning"): EventDraft => ({
  title,
  description: "Weekly planning session",
  start: new Date(2026, 8, 8, 9),
  end: new Date(2026, 8, 8, 10),
});

describe("useCalendarEvents", () => {
  it("creates, updates, moves, and removes events immutably", () => {
    const { result } = renderHook(() => useCalendarEvents());

    act(() => result.current.create(draft()));
    const created = result.current.events[0];

    expect(created).toMatchObject(draft());
    expect(created.id).toEqual(expect.any(String));

    act(() => result.current.update(created.id, draft("Updated planning")));
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      id: created.id,
      title: "Updated planning",
    });

    const start = new Date(2026, 8, 9, 13);
    const end = new Date(2026, 8, 9, 14, 30);
    act(() => result.current.move(created.id, start, end));
    expect(result.current.events[0]).toMatchObject({ start, end });

    act(() => result.current.remove(created.id));
    expect(result.current.events).toEqual([]);
  });

  it("does not alter other events when updating an unknown id", () => {
    const { result } = renderHook(() => useCalendarEvents());
    act(() => result.current.create(draft()));

    act(() => result.current.update("missing", draft("Ignored")));
    expect(result.current.events[0].title).toBe("Planning");
  });
});
