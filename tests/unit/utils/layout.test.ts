import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../../../src/types/event";
import {
  DAY_HEIGHT,
  HOUR_HEIGHT,
  MIN_BLOCK_HEIGHT,
} from "../../../src/constants";
import {
  blockGeometry,
  layoutEvents,
  minutesToPixels,
  pixelsToMinutes,
} from "../../../src/utils/layout";

const event = (
  id: string,
  start: [number, number],
  end: [number, number],
  day = 8,
): CalendarEvent => ({
  id,
  title: id,
  description: "",
  start: new Date(2026, 8, day, start[0], start[1]),
  end: new Date(2026, 8, day, end[0], end[1]),
});

describe("pixel/minute conversion", () => {
  it("round-trips", () => {
    expect(minutesToPixels(60)).toBe(HOUR_HEIGHT);
    expect(pixelsToMinutes(HOUR_HEIGHT)).toBe(60);
    expect(pixelsToMinutes(minutesToPixels(97.5))).toBeCloseTo(97.5);
  });
});

describe("blockGeometry", () => {
  it("places a block at its start minute with a proportional height", () => {
    const { top, height } = blockGeometry(
      new Date(2026, 8, 8, 9),
      new Date(2026, 8, 8, 11),
    );
    expect(top).toBe(9 * HOUR_HEIGHT);
    expect(height).toBe(2 * HOUR_HEIGHT);
  });

  it("clips an event that runs past midnight at the end of its column", () => {
    const { top, height } = blockGeometry(
      new Date(2026, 8, 8, 23),
      new Date(2026, 8, 9, 0, 0),
    );
    expect(top).toBe(23 * HOUR_HEIGHT);
    expect(height).toBe(HOUR_HEIGHT);
    expect(top + height).toBe(DAY_HEIGHT);
  });

  it("clips a multi-day event to a single column", () => {
    const { top, height } = blockGeometry(
      new Date(2026, 8, 8, 22),
      new Date(2026, 8, 11, 5),
    );
    expect(top + height).toBe(DAY_HEIGHT);
  });

  it("keeps short events readable", () => {
    const { height } = blockGeometry(
      new Date(2026, 8, 8, 9),
      new Date(2026, 8, 8, 9, 5),
    );
    expect(height).toBe(MIN_BLOCK_HEIGHT);
  });
});

describe("layoutEvents", () => {
  it("gives a lone event the full column width", () => {
    const [only] = layoutEvents([event("a", [9, 0], [10, 0])]);
    expect(only).toMatchObject({ column: 0, columns: 1 });
  });

  it("splits overlapping events into side-by-side columns", () => {
    const laid = layoutEvents([
      event("b", [9, 30], [11, 0]),
      event("a", [9, 0], [10, 0]),
    ]);
    const byId = Object.fromEntries(laid.map((l) => [l.event.id, l]));
    expect(byId.a).toMatchObject({ column: 0, columns: 2 });
    expect(byId.b).toMatchObject({ column: 1, columns: 2 });
  });

  it("keeps disjoint events full width", () => {
    const laid = layoutEvents([
      event("a", [9, 0], [10, 0]),
      event("b", [11, 0], [12, 0]),
    ]);
    expect(laid.every((l) => l.columns === 1)).toBe(true);
  });

  it("treats back-to-back events as non-overlapping", () => {
    const laid = layoutEvents([
      event("a", [9, 0], [10, 0]),
      event("b", [10, 0], [11, 0]),
    ]);
    expect(laid.every((l) => l.columns === 1)).toBe(true);
  });

  it("does not mutate the input array order", () => {
    const input = [event("b", [11, 0], [12, 0]), event("a", [9, 0], [10, 0])];
    layoutEvents(input);
    expect(input.map((e) => e.id)).toEqual(["b", "a"]);
  });
});
