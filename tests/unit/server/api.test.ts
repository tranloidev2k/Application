// @vitest-environment node
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEventStore } from "../../../server/db";
import type { EventStore, StoredEvent } from "../../../server/db";
import { createHandler } from "../../../server/app";

const body = {
  title: "  Gym  ",
  description: "Leg day",
  category: "personal",
  start: "2026-10-13T10:00:00.000Z",
  end: "2026-10-13T11:00:00.000Z",
};

describe("events API", () => {
  let store: EventStore;
  let server: Server;
  let base: string;

  const call = (path: string, method = "GET", payload?: unknown) =>
    fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });

  beforeEach(async () => {
    store = createEventStore(":memory:");
    server = createServer(createHandler(store));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    store.close();
  });

  it("supports the full CRUD lifecycle", async () => {
    const created = await call("/api/events", "POST", body);
    expect(created.status).toBe(201);
    const event = (await created.json()) as StoredEvent;
    expect(event).toMatchObject({ ...body, title: "Gym" });
    expect(event.id).toEqual(expect.any(String));

    expect(await (await call("/api/events")).json()).toEqual([event]);
    expect(await (await call(`/api/events/${event.id}`)).json()).toEqual(event);

    const updated = await call(`/api/events/${event.id}`, "PUT", {
      ...body,
      title: "Study React",
      category: "study",
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({
      id: event.id,
      title: "Study React",
      category: "study",
    });

    expect((await call(`/api/events/${event.id}`, "DELETE")).status).toBe(204);
    expect(await (await call("/api/events")).json()).toEqual([]);
  });

  it("lists events ordered by start time", async () => {
    await call("/api/events", "POST", {
      ...body,
      title: "Later",
      start: "2026-10-14T10:00:00.000Z",
      end: "2026-10-14T11:00:00.000Z",
    });
    await call("/api/events", "POST", { ...body, title: "Sooner" });
    const events = (await (await call("/api/events")).json()) as StoredEvent[];
    const titles = events.map((e) => e.title);
    expect(titles).toEqual(["Sooner", "Later"]);
  });

  it.each([
    [{ ...body, title: " " }, "Title is required."],
    [{ ...body, description: 1 }, "Description must be a string."],
    [{ ...body, category: "apply" }, "Category is invalid."],
    [{ ...body, start: "nope" }, "Start and end must be ISO dates."],
    [{ ...body, end: body.start }, "End time must be after the start time."],
    [null, "Body must be an object."],
  ])("rejects invalid drafts (%#)", async (payload, message) => {
    const res = await call("/api/events", "POST", payload);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: message });
  });

  it("rejects malformed JSON", async () => {
    const res = await fetch(`${base}/api/events`, {
      method: "POST",
      body: "{",
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown events and routes", async () => {
    expect((await call("/api/events/missing")).status).toBe(404);
    expect((await call("/api/events/missing", "PUT", body)).status).toBe(404);
    expect((await call("/api/events/missing", "DELETE")).status).toBe(404);
    expect((await call("/api/unknown")).status).toBe(404);
  });

  it("returns 405 for unsupported methods", async () => {
    expect((await call("/api/events", "PATCH")).status).toBe(405);
    expect((await call("/api/events/x", "PATCH")).status).toBe(405);
  });

  it("reports health", async () => {
    expect(await (await call("/api/health")).json()).toEqual({ ok: true });
  });
});
