import { Application, JobTask } from '../types'

export type ApplicationNextAction = { kind: 'interview' | 'task'; title: string; at?: string; overdue: boolean }

const dueTime = (task: JobTask) => task.dueAt ? new Date(task.dueAt).getTime() : Number.POSITIVE_INFINITY

/**
 * What happens next for one application: the soonest non-cancelled interview that has not started yet, otherwise the
 * most pressing open task (earliest due first, undated tasks last). Null when there is neither.
 * Client-only: depends on `now`. Shared by the list, the board and the detail page.
 */
export function getNextAction(app: Application, now: Date): ApplicationNextAction | null {
  const nowTime = now.getTime()
  const interview = app.interviews
    .filter(item => !item.cancelledAt && new Date(item.startsAt).getTime() >= nowTime)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0]
  if (interview) return { kind: 'interview', title: interview.title || 'Phỏng vấn', at: interview.startsAt, overdue: false }

  const task = app.tasks.filter(item => !item.completedAt).sort((a, b) => dueTime(a) - dueTime(b))[0]
  if (task) return { kind: 'task', title: task.title, at: task.dueAt, overdue: dueTime(task) < nowTime }
  return null
}
