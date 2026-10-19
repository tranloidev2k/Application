import { Activity, Interview, JobTask, PersonalTask } from '../../types'
import { calendarDateKey } from '../../utils/date'
import { withEventColor } from '../../utils/eventColors'
import { uid } from '../../utils/id'
import { addCalendarDays, startOfCalendarWeek } from './calendarUtils'

/** 'Nhân bản' makes at most this many copies at once. */
export const MAX_DUPLICATES = 60

/** A local date key ('yyyy-MM-dd') as local midnight. */
export const dateFromKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** `source`'s local time of day on the date `dayKey` (local time, so a copy keeps its clock time across DST). */
export const startOnDay = (source: Date, dayKey: string) => {
  const day = dateFromKey(dayKey)
  day.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds())
  return day
}

/** Shifts `end` by the same amount as the start moved from `from` to `to`, keeping the duration. */
const shifted = (end: string, from: Date, to: Date) => new Date(to.getTime() + (new Date(end).getTime() - from.getTime())).toISOString()

export type DuplicatePreset = { label: string; keys: string[] }

/**
 * Quick picks, counted from the later of the event's date and today (so an old event is copied forward):
 * the next 5 days, Monday–Friday of the following week, and the event's weekday on each of the next 4 weeks.
 */
export function duplicatePresets(sourceKey: string, todayKey: string): DuplicatePreset[] {
  const base = dateFromKey(sourceKey > todayKey ? sourceKey : todayKey)
  const sourceWeekday = dateFromKey(sourceKey).getDay()
  const nextMonday = addCalendarDays(startOfCalendarWeek(base), 8)
  let firstWeekly = addCalendarDays(base, 1)
  while (firstWeekly.getDay() !== sourceWeekday) firstWeekly = addCalendarDays(firstWeekly, 1)
  const keys = (start: Date, count: number, step = 1) => Array.from({ length: count }, (_, index) => calendarDateKey(addCalendarDays(start, index * step)))
  return [
    { label: '5 ngày tới', keys: keys(addCalendarDays(base, 1), 5) },
    { label: 'T2–T6 tuần sau', keys: keys(nextMonday, 5) },
    { label: 'Mỗi tuần, 4 tuần', keys: keys(firstWeekly, 4, 7) },
  ].map(preset => ({ ...preset, keys: preset.keys.filter(key => key !== sourceKey) }))
}

/** Copies of a personal task on each day: same title, note, colour, time of day and duration; new ids, not completed. */
export function personalTaskCopies(source: PersonalTask, dayKeys: string[]): PersonalTask[] {
  const start = new Date(source.startsAt)
  const updatedAt = new Date().toISOString()
  return dayKeys.map(key => {
    const startsAt = startOnDay(start, key)
    const copy: PersonalTask = {
      id: uid(),
      title: source.title,
      startsAt: startsAt.toISOString(),
      endsAt: shifted(source.endsAt, start, startsAt),
      updatedAt,
    }
    if (source.note) copy.note = source.note
    return withEventColor(copy, source.color)
  })
}

/** Copies of an application task, shaped like those TaskModal creates (a task without an end keeps none). */
export function jobTaskCopies(source: JobTask & { dueAt: string }, dayKeys: string[]): JobTask[] {
  const start = new Date(source.dueAt)
  return dayKeys.map(key => {
    const dueAt = startOnDay(start, key)
    const copy: JobTask = { id: uid(), title: source.title, dueAt: dueAt.toISOString(), note: source.note }
    if (source.endsAt) copy.endsAt = shifted(source.endsAt, start, dueAt)
    return withEventColor(copy, source.color)
  })
}

/** Copies of an interview (format, place and interviewer included), never cancelled. */
export function interviewCopies(source: Interview, dayKeys: string[]): Interview[] {
  const start = new Date(source.startsAt)
  return dayKeys.map(key => {
    const startsAt = startOnDay(start, key)
    const copy: Interview = {
      id: uid(),
      title: source.title,
      startsAt: startsAt.toISOString(),
      endsAt: shifted(source.endsAt, start, startsAt),
      timeZone: source.timeZone,
      format: source.format,
      locationOrMeetingUrl: source.locationOrMeetingUrl,
      interviewer: source.interviewer,
    }
    if (source.note) copy.note = source.note
    return withEventColor(copy, source.color)
  })
}

/** The activity ApplicationDetail adds for a newly scheduled interview, one per copy. */
export const interviewCreatedActivity = (interview: Interview, createdAt: string): Activity => ({
  id: uid(), type: 'INTERVIEW_CREATED', createdAt, label: 'Đã lên lịch phỏng vấn', detail: interview.title,
})
