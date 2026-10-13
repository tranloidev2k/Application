import type { KeyboardEvent, MouseEvent } from 'react'
import { Application, JobTask, PersonalTask } from '../../types'
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
  personal?: PersonalTask
}
/** Where a popover opens: a viewport point (the click, or the bottom-left corner of a keyboard-activated element). */
export type PopoverAnchor = { x: number; y: number }

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

/** Screen-reader name of an event chip: 'Phỏng vấn, 17:00, Vòng kỹ thuật, FPT Software'. */
export const eventAriaLabel = (event: CalendarEvent) => [
  KIND_LABEL[event.kind],
  formatTime(event.startsAt),
  event.title,
  event.application?.companyName,
  event.completedAt ? 'đã hoàn thành' : '',
].filter(Boolean).join(', ')

/** The pointer for a mouse click; the element's bottom-left corner for a keyboard activation (which has no pointer). */
export const anchorOf = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>): PopoverAnchor => {
  if ('clientX' in event && event.detail > 0) return { x: event.clientX, y: event.clientY }
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: rect.left, y: rect.bottom + 4 }
}
