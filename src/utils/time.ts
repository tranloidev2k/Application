import {
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
  SNAP_MINUTES,
} from "../constants";

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

export function minutesOfDay(date: Date) {
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
}

export function durationMinutes(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / MS_PER_MINUTE;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function snapMinutes(value: number) {
  return clamp(
    Math.round(value / SNAP_MINUTES) * SNAP_MINUTES,
    0,
    MINUTES_PER_DAY,
  );
}

export function dateAtMinutes(day: Date, minutes: number) {
  const d = startOfDay(day);
  d.setMinutes(clamp(minutes, 0, MINUTES_PER_DAY));
  return d;
}

export function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 || 12;
  const displayMinute = String(minutes).padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatUtcOffset(date: Date = new Date()) {
  const totalMinutes = -date.getTimezoneOffset();
  const sign = totalMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(totalMinutes);
  const hours = String(Math.floor(absolute / MINUTES_PER_HOUR)).padStart(
    2,
    "0",
  );
  const minutes = absolute % MINUTES_PER_HOUR;
  return minutes === 0
    ? `GMT${sign}${hours}`
    : `GMT${sign}${hours}:${String(minutes).padStart(2, "0")}`;
}

export function inputDateTime(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
) {
  return a.start < b.end && b.start < a.end;
}

export function makeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
