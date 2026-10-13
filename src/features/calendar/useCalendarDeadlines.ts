'use client'

import { useMemo } from 'react'
import { Application } from '../../types'
import { calendarDateKey } from '../../utils/date'
import { CalendarDeadline } from './calendarUtils'

/**
 * Application deadlines for the calendar, grouped by local date key and sorted by company: one per non-deleted SAVED
 * application with a `deadlineAt`. The date ('yyyy-MM-dd') is read as a local date, so it never shifts a day across
 * time zones. Kept apart from the timed events on purpose: a deadline is never laid out at 00:00 in the week grid,
 * dragged, moved or ticked off.
 */
export function useCalendarDeadlines(applications: Application[]) {
  return useMemo(() => {
    const byDay = new Map<string, CalendarDeadline[]>()
    const saved = applications
      .filter(application => !application.deletedAt && application.status === 'SAVED' && application.deadlineAt)
      .sort((a, b) => a.companyName.localeCompare(b.companyName, 'vi'))
    for (const application of saved) {
      const date = new Date(`${application.deadlineAt!.slice(0, 10)}T00:00:00`)
      if (Number.isNaN(date.getTime())) continue
      const dayKey = calendarDateKey(date)
      const deadline = { id: application.id, dayKey, application }
      const list = byDay.get(dayKey)
      if (list) list.push(deadline)
      else byDay.set(dayKey, [deadline])
    }
    return byDay
  }, [applications])
}
