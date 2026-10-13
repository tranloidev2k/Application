'use client'

import { useMemo } from 'react'
import { Application, PersonalTask } from '../../types'
import { calendarDateKey } from '../../utils/date'
import { CalendarEvent } from './calendarUtils'

/**
 * Every calendar item, sorted by start: personal tasks, dated application tasks and interviews that are not cancelled
 * (of applications that are not deleted). `byDay` groups them by local date key, in the same order.
 */
export function useCalendarEvents(applications: Application[], personalTasks: PersonalTask[]) {
  return useMemo(() => {
    const events: CalendarEvent[] = [
      ...personalTasks.map(personal => ({
        id: personal.id,
        kind: 'personal' as const,
        title: personal.title,
        startsAt: personal.startsAt,
        endsAt: personal.endsAt,
        completedAt: personal.completedAt,
        note: personal.note,
        personal,
      })),
      ...applications.filter(application => !application.deletedAt).flatMap(application => [
        ...application.tasks.filter(task => task.dueAt).map(task => ({
          id: task.id,
          kind: 'task' as const,
          title: task.title,
          startsAt: task.dueAt!,
          endsAt: task.endsAt,
          completedAt: task.completedAt,
          note: task.note,
          application,
          task,
        })),
        ...application.interviews.filter(interview => !interview.cancelledAt).map(interview => ({
          id: interview.id,
          kind: 'interview' as const,
          title: interview.title,
          startsAt: interview.startsAt,
          endsAt: interview.endsAt,
          application,
        })),
      ]),
    ].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    const byDay = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const key = calendarDateKey(event.startsAt)
      const list = byDay.get(key)
      if (list) list.push(event)
      else byDay.set(key, [event])
    }
    return { events, byDay }
  }, [applications, personalTasks])
}
