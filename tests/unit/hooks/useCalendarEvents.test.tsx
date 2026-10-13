import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventDraft } from "../../../src/types/event";
import { useCalendarEvents } from "../../../src/hooks/useCalendarEvents";
import { createFakeSupabase } from "../fakeSupabase";

type FakeSupabase = ReturnType<typeof createFakeSupabase>;

const draft = (title = "Planning"): EventDraft => ({
  title,
  description: "Weekly planning session",
  category: "meeting",
  start: new Date(2026, 8, 8, 9),
  end: new Date(2026, 8, 8, 10),
});

const fake = vi.hoisted(() => ({ current: null as FakeSupabase | null }));
const ensureSession = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("../../../src/lib/supabase", () => ({
  ensureSession,
  getSupabase: () => fake.current?.client,
}));

function mockServer() {
  fake.current = createFakeSupabase();
  return fake.current;
}

describe("useCalendarEvents", () => {
  beforeEach(() => {
    ensureSession.mockReset();
    ensureSession.mockResolvedValue(undefined);
  });

  it("loads events from Supabase on mount", async () => {
    const { rows } = mockServer();
    rows.set("a", {
      id: "a",
      title: "Stored",
      description: "",
      category: "study",
      start_at: new Date(2026, 8, 8, 9).toISOString(),
      end_at: new Date(2026, 8, 8, 10).toISOString(),
    });

    const { result } = renderHook(() => useCalendarEvents());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      id: "a",
      title: "Stored",
      category: "study",
      start: new Date(2026, 8, 8, 9),
    });
  });

  it("creates, updates, moves, and removes events through Supabase", async () => {
    const { rows } = mockServer();
    const { result } = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.create(draft()));
    const created = result.current.events[0];
    expect(created).toMatchObject(draft());
    expect(rows.size).toBe(1);

    await act(() => result.current.update(created.id, draft("Updated")));
    expect(result.current.events[0]).toMatchObject({
      id: created.id,
      title: "Updated",
    });
    expect(rows.get(created.id)?.title).toBe("Updated");

    const start = new Date(2026, 8, 9, 13);
    const end = new Date(2026, 8, 9, 14, 30);
    await act(() => result.current.move(created.id, start, end));
    expect(result.current.events[0]).toMatchObject({
      title: "Updated",
      category: "meeting",
      start,
      end,
    });
    expect(rows.get(created.id)?.start_at).toBe(start.toISOString());

    await act(() => result.current.remove(created.id));
    expect(result.current.events).toEqual([]);
    expect(rows.size).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("restores server state and reports an error when a save fails", async () => {
    mockServer();
    const { result } = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.create(draft()));

    await act(() => result.current.update("missing", draft("Ignored")));
    expect(result.current.error).toBe("Event not found.");
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe("Planning");

    act(() => result.current.dismissError());
    expect(result.current.error).toBeNull();
  });

  it("reports an error when Supabase is unreachable", async () => {
    mockServer();
    ensureSession.mockRejectedValue(new Error("Network down"));
    const { result } = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network down");

    await act(() => result.current.create(draft()));
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe("Network down");
  });

  it("ignores moves for unknown events", async () => {
    mockServer();
    const { result } = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.move("missing", new Date(), new Date()));
    expect(ensureSession).toHaveBeenCalledTimes(1);
  });

  it("reports database errors", async () => {
    const server = mockServer();
    const { result } = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.create(draft()));

    server.fail("permission denied");
    await act(() => result.current.remove(result.current.events[0].id));
    expect(result.current.error).toBe("permission denied");
    expect(server.rows.size).toBe(1);

    await act(() => result.current.create(draft("Second")));
    expect(result.current.events).toHaveLength(1);
    expect(result.current.error).toBe("permission denied");
  });
});
