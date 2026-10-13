'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ToastFn, ToastOptions, UpdateApplicationFn } from '../../context/AppDataContext'
import type { usePersonalTasks } from '../../hooks/usePersonalTasks'
import { CalendarEvent } from './calendarUtils'

type PersonalTasksApi = ReturnType<typeof usePersonalTasks>
type MoveEventFn = (event: CalendarEvent, target: Date, undoing?: boolean) => void

/**
 * Calendar writes: tick a task done (or reopen it) and move any event to a new start, keeping its duration. A move's
 * toast offers 'Hoàn tác', which moves the event back to its original start through the latest `moveEvent` (a ref, so a
 * toast clicked after other changes never runs a stale closure). Personal tasks are read back from the current list,
 * so a popover or toast holding an older copy never overwrites a newer change.
 */
export function useCalendarMutations(personalTasks: PersonalTasksApi, updateApplication: UpdateApplicationFn, toast: ToastFn) {
  const { save, tasks } = personalTasks
  const tasksRef = useRef(tasks)
  useEffect(() => { tasksRef.current = tasks }, [tasks])

  const toggleTask = useCallback((event: CalendarEvent) => {
    if (event.personal) {
      const personal = tasksRef.current.find(item => item.id === event.id) ?? event.personal
      const completedAt = personal.completedAt ? undefined : new Date().toISOString()
      void save({ ...personal, completedAt, updatedAt: new Date().toISOString() }, completedAt ? 'Đã hoàn thành công việc' : 'Đã mở lại công việc')
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

  const moveRef = useRef<MoveEventFn | null>(null)
  const moveEvent = useCallback<MoveEventFn>((event, target, undoing = false) => {
    const originalStart = new Date(event.startsAt)
    const application = event.application
    // The undo moves this same snapshot back to where it started; undoing an undo is not offered.
    const toastOptions: ToastOptions | undefined = undoing ? undefined : {
      actionLabel: 'Hoàn tác',
      onAction: () => moveRef.current?.(event, new Date(event.startsAt), true),
    }
    const message = (moved: string) => undoing ? 'Đã hoàn tác chuyển lịch' : moved
    if (event.personal) {
      const personal = tasksRef.current.find(item => item.id === event.id) ?? event.personal
      const duration = new Date(event.personal.endsAt).getTime() - originalStart.getTime()
      void save({ ...personal, startsAt: target.toISOString(), endsAt: new Date(target.getTime() + duration).toISOString(), updatedAt: new Date().toISOString() }, message('Đã chuyển lịch công việc'), toastOptions)
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
    toast(message(event.kind === 'task' ? 'Đã chuyển lịch công việc' : 'Đã chuyển lịch phỏng vấn'), toastOptions)
  }, [save, toast, updateApplication])
  useEffect(() => { moveRef.current = moveEvent }, [moveEvent])

  return { toggleTask, moveEvent }
}
