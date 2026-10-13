'use client'

import { useCallback } from 'react'
import type { ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import type { usePersonalTasks } from '../../hooks/usePersonalTasks'
import { CalendarEvent } from './calendarUtils'

type PersonalTasksApi = ReturnType<typeof usePersonalTasks>

/** Calendar writes: tick a task done (or reopen it) and move any event to a new start, keeping its duration. */
export function useCalendarMutations(personalTasks: PersonalTasksApi, updateApplication: UpdateApplicationFn, toast: ToastFn) {
  const { save } = personalTasks

  const toggleTask = useCallback((event: CalendarEvent) => {
    if (event.personal) {
      const completedAt = event.personal.completedAt ? undefined : new Date().toISOString()
      void save({ ...event.personal, completedAt, updatedAt: new Date().toISOString() }, completedAt ? 'Đã hoàn thành công việc' : 'Đã mở lại công việc')
      return
    }
    if (!event.task || !event.application) return
    const completedAt = event.task.completedAt ? undefined : new Date().toISOString()
    updateApplication(event.application.id, application => ({
      ...application,
      updatedAt: new Date().toISOString(),
      tasks: application.tasks.map(task => task.id === event.id ? { ...task, completedAt } : task),
    }))
    toast(completedAt ? 'Đã hoàn thành công việc' : 'Đã mở lại công việc')
  }, [save, toast, updateApplication])

  const moveEvent = useCallback((event: CalendarEvent, target: Date) => {
    const originalStart = new Date(event.startsAt)
    const application = event.application
    if (event.personal) {
      const duration = new Date(event.personal.endsAt).getTime() - originalStart.getTime()
      void save({ ...event.personal, startsAt: target.toISOString(), endsAt: new Date(target.getTime() + duration).toISOString(), updatedAt: new Date().toISOString() }, 'Đã chuyển lịch công việc')
      return
    }
    if (!application) return
    if (event.kind === 'task') {
      const duration = event.endsAt ? new Date(event.endsAt).getTime() - originalStart.getTime() : 45 * 60000
      updateApplication(application.id, application => ({
        ...application,
        updatedAt: new Date().toISOString(),
        tasks: application.tasks.map(task => task.id === event.id ? { ...task, dueAt: target.toISOString(), endsAt: new Date(target.getTime() + duration).toISOString() } : task),
      }))
    } else {
      const duration = event.endsAt ? new Date(event.endsAt).getTime() - originalStart.getTime() : 60 * 60000
      updateApplication(application.id, application => ({
        ...application,
        updatedAt: new Date().toISOString(),
        interviews: application.interviews.map(interview => interview.id === event.id ? {
          ...interview,
          startsAt: target.toISOString(),
          endsAt: new Date(target.getTime() + duration).toISOString(),
        } : interview),
      }))
    }
    toast(event.kind === 'task' ? 'Đã chuyển lịch công việc' : 'Đã chuyển lịch phỏng vấn')
  }, [save, toast, updateApplication])

  return { toggleTask, moveEvent }
}
