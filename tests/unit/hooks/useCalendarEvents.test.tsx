import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventDraft } from "../../../src/types/event";
import { useCalendarEvents } from "../../../src/hooks/useCalendarEvents";

const draft = (title = "Planning"): EventDraft => ({
  title,
  description: "Weekly planning session",
  category: "meeting",
  start: new Date(2026, 8, 8, 9),
  end: new Date(2026, 8, 8, 10),
});

const json = (body: unknown, status = 200) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Minimal in-memory stand-in for the REST API.
function mockServer() {
  const rows = new Map<string, Record<string, unknown>>();
  let nextId = 1;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const id = url.split("/api/events/")[1];
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (method === "GET") return json([...rows.values()]);
    if (method === "POST") {
      const row = { ...body, id: String(nextId++) };
      rows.set(row.id, row);
      return json(row, 201);
    }
    if (!rows.has(id)) return json({ error: "Event not found." }, 404);
    if (method === "PUT") {
      rows.set(id, { ...body, id });
      return json(rows.get(id));
    }
    rows.delete(id);
    return new Response(null, { status: 204 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { rows, fetchMock };
}

describe("useCalendarEvents", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads events from the API on mount", async () => {
    const { rows } = mockServer();
    rows.set("a", {
      id: "a",
      title: "Stored",
      description: "",
      category: "study",
      start: new Date(2026, 8, 8, 9).toISOString(),
      end: new Date(2026, 8, 8, 10).toISOString(),
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

  it("creates, updates, moves, and removes events through the API", async () => {
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
    expect(rows.get(created.id)?.start).toBe(start.toISOString());

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

  it("reports an error when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Network down");
      }),
    );
    const { result } = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network down");

    await act(() => result.current.create(draft()));
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe("Network down");
  });

  it("ignores moves for unknown events", async () => {
    const { fetchMock } = mockServer();
    const { result } = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.move("missing", new Date(), new Date()));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
