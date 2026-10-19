'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import type { usePersonalTasks } from '../../hooks/usePersonalTasks'
import { CalendarEvent } from './calendarUtils'
import { interviewCopies, interviewCreatedActivity, jobTaskCopies, MAX_DUPLICATES, personalTaskCopies } from './duplicateEvent'

type PersonalTasksApi = ReturnType<typeof usePersonalTasks>
const UNDONE = 'Đã hoàn tác nhân bản'

/**
 * 'Nhân bản': copies one event onto each chosen day (at most MAX_DUPLICATES). Personal tasks are saved in one batch
 * (all shown at once, all rolled back if the database refuses). Application tasks and interviews are appended in one
 * `updateApplication`, the way TaskModal / InterviewModal add them (an interview also gets its 'Đã lên lịch phỏng vấn'
 * activity). The success toast 'Đã tạo N bản sao' offers 'Hoàn tác', which removes exactly those copies (and their
 * activities). The source is read from the current data, so a newer change to it is what gets copied.
 */
export function useDuplicateEvent(personalTasks: PersonalTasksApi, updateApplication: UpdateApplicationFn, toast: ToastFn) {
  const { tasks, addMany, removeMany } = personalTasks
  const tasksRef = useRef(tasks)
  useEffect(() => { tasksRef.current = tasks }, [tasks])

  return useCallback((event: CalendarEvent, dayKeys: string[]) => {
    const days = [...new Set(dayKeys)].sort().slice(0, MAX_DUPLICATES)
    if (!days.length) return
    const message = `Đã tạo ${days.length} bản sao`

    if (event.personal) {
      const source = tasksRef.current.find(item => item.id === event.id) ?? event.personal
      const copies = personalTaskCopies(source, days)
      const ids = copies.map(copy => copy.id)
      void addMany(copies, message, { actionLabel: 'Hoàn tác', onAction: () => { void removeMany(ids, UNDONE) } })
      return
    }

    const application = event.application
    if (!application) return
    const ids = new Set<string>()
    const activityIds = new Set<string>()
    if (event.kind === 'task') {
      if (!event.task) return
      const snapshot = event.task
      updateApplication(application.id, current => {
        const source = current.tasks.find(task => task.id === event.id) ?? snapshot
        const copies = jobTaskCopies({ ...source, dueAt: source.dueAt ?? event.startsAt }, days)
        copies.forEach(copy => ids.add(copy.id))
        return { ...current, updatedAt: new Date().toISOString(), tasks: [...copies, ...current.tasks] }
      })
    } else {
      if (!event.interview) return
      const snapshot = event.interview
      updateApplication(application.id, current => {
        const now = new Date().toISOString()
        const source = current.interviews.find(interview => interview.id === event.id) ?? snapshot
        const copies = interviewCopies(source, days)
        const activities = copies.map(copy => interviewCreatedActivity(copy, now))
        copies.forEach(copy => ids.add(copy.id))
        activities.forEach(activity => activityIds.add(activity.id))
        return { ...current, updatedAt: now, interviews: [...copies, ...current.interviews], activities: [...activities, ...current.activities] }
      })
    }
    if (!ids.size) return
    toast(message, {
      actionLabel: 'Hoàn tác',
      onAction: () => {
        updateApplication(application.id, current => ({
          ...current,
          updatedAt: new Date().toISOString(),
          tasks: current.tasks.filter(task => !ids.has(task.id)),
          interviews: current.interviews.filter(interview => !ids.has(interview.id)),
          activities: current.activities.filter(activity => !activityIds.has(activity.id)),
        }))
        toast(UNDONE)
      },
    })
  }, [addMany, removeMany, toast, updateApplication])
}
