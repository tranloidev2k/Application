import { afterEach, describe, expect, it, vi } from "vitest";
import { MINUTES_PER_DAY } from "../../../src/constants";
import {
  addDays,
  addMinutes,
  clamp,
  dateAtMinutes,
  durationMinutes,
  formatDate,
  formatTime,
  formatUtcOffset,
  inputDateTime,
  isSameDay,
  makeId,
  minutesOfDay,
  overlaps,
  snapMinutes,
  startOfDay,
} from "../../../src/utils/time";

describe("snapMinutes", () => {
  it("rounds to the nearest 15-minute step", () => {
    expect(snapMinutes(0)).toBe(0);
    expect(snapMinutes(7)).toBe(0);
    expect(snapMinutes(8)).toBe(15);
    expect(snapMinutes(22.4)).toBe(15);
    expect(snapMinutes(23)).toBe(30);
  });

  it("clamps to the bounds of a single day", () => {
    expect(snapMinutes(-500)).toBe(0);
    expect(snapMinutes(99_999)).toBe(MINUTES_PER_DAY);
  });
});

describe("dateAtMinutes", () => {
  it("builds a local time on the given day", () => {
    expect(dateAtMinutes(new Date(2026, 8, 8, 17, 42), 9 * 60 + 30)).toEqual(
      new Date(2026, 8, 8, 9, 30),
    );
  });

  it("treats 24:00 as midnight of the following day", () => {
    expect(dateAtMinutes(new Date(2026, 8, 8), MINUTES_PER_DAY)).toEqual(
      new Date(2026, 8, 9),
    );
  });

  it("clamps values outside the day", () => {
    expect(dateAtMinutes(new Date(2026, 8, 8), -60)).toEqual(
      new Date(2026, 8, 8),
    );
    expect(dateAtMinutes(new Date(2026, 8, 8), 5_000)).toEqual(
      new Date(2026, 8, 9),
    );
  });
});

describe("date helpers", () => {
  it("normalises to the start of a day", () => {
    expect(startOfDay(new Date(2026, 8, 8, 23, 59, 59, 999))).toEqual(
      new Date(2026, 8, 8),
    );
  });

  it("crosses month boundaries when adding days", () => {
    expect(addDays(new Date(2026, 8, 30), 2)).toEqual(new Date(2026, 9, 2));
  });

  it("adds minutes across midnight", () => {
    expect(addMinutes(new Date(2026, 8, 8, 23, 30), 60)).toEqual(
      new Date(2026, 8, 9, 0, 30),
    );
  });

  it("measures duration in minutes", () => {
    expect(
      durationMinutes(new Date(2026, 8, 8, 9), new Date(2026, 8, 8, 10, 30)),
    ).toBe(90);
  });

  it("reads minutes of day and compares days", () => {
    expect(minutesOfDay(new Date(2026, 8, 8, 9, 45))).toBe(585);
    expect(isSameDay(new Date(2026, 8, 8, 1), new Date(2026, 8, 8, 23))).toBe(
      true,
    );
    expect(isSameDay(new Date(2026, 8, 8), new Date(2026, 8, 9))).toBe(false);
  });
});

describe("clamp", () => {
  it("bounds a value on both sides", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

describe("overlaps", () => {
  const range = (fromHour: number, toHour: number) => ({
    start: new Date(2026, 8, 8, fromHour),
    end: new Date(2026, 8, 8, toHour),
  });

  it("detects intersecting ranges", () => {
    expect(overlaps(range(9, 11), range(10, 12))).toBe(true);
    expect(overlaps(range(9, 12), range(10, 11))).toBe(true);
  });

  it("treats touching edges as non-overlapping", () => {
    expect(overlaps(range(9, 10), range(10, 11))).toBe(false);
    expect(overlaps(range(9, 10), range(14, 15))).toBe(false);
  });
});

describe("inputDateTime", () => {
  it("emits a zero-padded datetime-local value", () => {
    expect(inputDateTime(new Date(2026, 0, 5, 7, 4))).toBe("2026-01-05T07:04");
  });
});

describe("formatUtcOffset", () => {
  it("renders whole-hour and half-hour offsets with the inverted sign", () => {
    const at = (offset: number) =>
      ({ getTimezoneOffset: () => offset }) as Date;
    expect(formatUtcOffset(at(-420))).toBe("GMT+07");
    expect(formatUtcOffset(at(0))).toBe("GMT+00");
    expect(formatUtcOffset(at(300))).toBe("GMT-05");
    expect(formatUtcOffset(at(-330))).toBe("GMT+05:30");
  });
});

describe("formatTime", () => {
  it("formats morning times with AM", () => {
    expect(formatTime(new Date(2026, 8, 8, 0, 0))).toBe("12:00 AM");
    expect(formatTime(new Date(2026, 8, 8, 9, 5))).toBe("9:05 AM");
    expect(formatTime(new Date(2026, 8, 8, 11, 45))).toBe("11:45 AM");
  });

  it("formats afternoon and evening times with PM", () => {
    expect(formatTime(new Date(2026, 8, 8, 12, 0))).toBe("12:00 PM");
    expect(formatTime(new Date(2026, 8, 8, 13, 30))).toBe("1:30 PM");
    expect(formatTime(new Date(2026, 8, 8, 23, 59))).toBe("11:59 PM");
  });
});

describe("formatDate", () => {
  it("formats a local date with weekday, month, and day", () => {
    expect(formatDate(new Date(2026, 8, 8))).toBe("Tue, Sep 8");
  });
});

describe("makeId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("produces unique ids", () => {
    expect(makeId()).not.toBe(makeId());
  });

  it("falls back when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    expect(makeId()).toMatch(/^\d+-[a-z0-9]+$/);
  });
});
