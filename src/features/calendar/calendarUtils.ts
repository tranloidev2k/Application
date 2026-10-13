import type { KeyboardEvent, MouseEvent } from 'react'
import { Application, Interview, JobTask, PersonalTask } from '../../types'
import { formatTime } from '../../utils/date'

export type CalendarView = 'month' | 'week'
export type CalendarEventKind = 'task' | 'interview' | 'personal'
export type CalendarEvent = {
  id: string
  kind: CalendarEventKind
  title: string
  startsAt: string
  endsAt?: string
  completedAt?: string
  note?: string
  application?: Application
  task?: JobTask
  interview?: Interview
  personal?: PersonalTask
}
/**
 * A SAVED application's deadline, shown read-only on its local date (never a timed event: it is not dragged, moved or
 * ticked off).
 */
export type CalendarDeadline = { id: string; dayKey: string; application: Application }
/**
 * Where a popover opens: its top-left corner at (x, y), or, when it does not fit below, its bottom edge at `above`.
 * For a click that is the pointer; for a keyboard activation, the element's rect (below it, or above it, or beside
 * it via `side` when neither fits, so it never covers the element that opened it).
 */
export type PopoverAnchor = { x: number; y: number; above: number; side?: { left: number; right: number; top: number } }

/** Week grid geometry: the whole day, 00:00–24:00, at 64px per hour. */
export const HOUR_HEIGHT = 64
export const DAY_MINUTES = 24 * 60
export const WEEK_GRID_HEIGHT = 24 * HOUR_HEIGHT
/** Shown before the week view has a better hour to open at (an event this week or the current hour). */
export const DEFAULT_SCROLL_HOUR = 7
/** A month cell shows at most this many chips; with more events it shows one fewer plus '+N mục khác'. */
export const MONTH_CHIP_LIMIT = 3
export const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export const WEEKDAY_HEADERS = ['CN', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7']
export const WEEKDAY_NAMES = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export const KIND_LABEL: Record<CalendarEventKind, string> = {
  interview: 'Phỏng vấn',
  task: 'Việc ứng tuyển',
  personal: 'Việc cá nhân',
}

export const startOfCalendarWeek = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return date
}
export const addCalendarDays = (value: Date, amount: number) => {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}
export const calendarStateFromParams = (params: { get: (name: string) => string | null }) => {
  const view: CalendarView = params.get('view') === 'month' ? 'month' : 'week'
  const dateValue = params.get('date')
  const parsedDate = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date()
  const cursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  return { view, cursor }
}

/** The 7 days (Sunday first) of the week containing `cursor`. */
export const weekDaysOf = (cursor: Date) => {
  const start = startOfCalendarWeek(cursor)
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(start, index))
}
/** The 42 days (6 weeks, Sunday first) of the month grid containing `cursor`. */
export const monthGridDays = (cursor: Date) => {
  const start = startOfCalendarWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1))
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(start, index))
}

/** 'Tháng 10 năm 2026'. */
export const monthTitle = (cursor: Date) => `Tháng ${cursor.getMonth() + 1} năm ${cursor.getFullYear()}`
/** '11 – 17 thg 10, 2026', 'thg 9 – thg 10, 2026' across two months, 'thg 12, 2026 – thg 1, 2027' across two years. */
export const weekTitle = (first: Date, last: Date) => {
  if (first.getFullYear() !== last.getFullYear()) return `thg ${first.getMonth() + 1}, ${first.getFullYear()} – thg ${last.getMonth() + 1}, ${last.getFullYear()}`
  if (first.getMonth() !== last.getMonth()) return `thg ${first.getMonth() + 1} – thg ${last.getMonth() + 1}, ${last.getFullYear()}`
  return `${first.getDate()} – ${last.getDate()} thg ${last.getMonth() + 1}, ${last.getFullYear()}`
}
/** The local UTC offset of `date` as 'GMT+7', 'GMT-3:30' or 'GMT+0'. */
export const timezoneLabel = (date: Date) => {
  const offset = -date.getTimezoneOffset()
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  return `GMT${offset < 0 ? '-' : '+'}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`
}

/** Minutes since local midnight. */
export const minuteOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes()
/** The event's end: its own, or 45 minutes after the start for a task without one. */
export const calendarEventEnd = (event: CalendarEvent) => event.endsAt
  ? new Date(event.endsAt)
  : new Date(new Date(event.startsAt).getTime() + 45 * 60000)
export const sameCalendarEvent = (a: CalendarEvent | null | undefined, b: CalendarEvent) => !!a && a.id === b.id && a.kind === b.kind
export const calendarEventKey = (event: CalendarEvent) => `${event.kind}-${event.id}`

/** '45 phút', '1 giờ', '1 giờ 30 phút'. */
export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} phút`
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`
}
/** '16:00–16:45'. */
export const eventTimeRange = (event: CalendarEvent) => `${formatTime(event.startsAt)}–${formatTime(calendarEventEnd(event))}`

/** Screen-reader name of an event chip: 'Phỏng vấn, 17:00 đến 18:00, Vòng kỹ thuật, FPT Software'. */
export const eventAriaLabel = (event: CalendarEvent) => [
  KIND_LABEL[event.kind],
  `${formatTime(event.startsAt)} đến ${formatTime(calendarEventEnd(event))}`,
  event.title,
  event.application?.companyName,
  event.completedAt ? 'đã hoàn thành' : '',
].filter(Boolean).join(', ')

/** Screen-reader name of a deadline chip: 'Hạn nộp hồ sơ, Grab, Mobile Developer, đã quá hạn'. */
export const deadlineAriaLabel = (deadline: CalendarDeadline, overdue: boolean) => [
  'Hạn nộp hồ sơ',
  deadline.application.companyName,
  deadline.application.jobTitle,
  overdue ? 'đã quá hạn' : '',
].filter(Boolean).join(', ')

/**
 * The pointer for a mouse click; for a keyboard activation (which has no pointer, so `detail` is 0) the element's
 * rect, read now in the handler: under its bottom-left corner, or above it when there is no room below.
 */
export const anchorOf = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>): PopoverAnchor => {
  if ('clientX' in event && event.detail > 0) return { x: event.clientX, y: event.clientY, above: event.clientY }
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: rect.left, y: rect.bottom + 4, above: rect.top - 4, side: { left: rect.left - 8, right: rect.right + 8, top: rect.top } }
}
/** Anchors a popover beside an element (to its right), e.g. an item of the '+N mục khác' menu that is closing. */
export const anchorBeside = (element: HTMLElement): PopoverAnchor => {
  const rect = element.getBoundingClientRect()
  return { x: rect.right + 8, y: rect.top, above: rect.bottom }
}
