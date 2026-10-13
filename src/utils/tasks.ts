import { Application } from '../types'

/** Open (not completed) tasks of live applications whose due time is before `now`. Client-only: depends on the clock. */
export function countOverdueTasks(applications: Application[], now: Date) {
  const nowTime = now.getTime()
  return applications.reduce((count, app) => app.deletedAt ? count
    : count + app.tasks.filter(task => !task.completedAt && task.dueAt && new Date(task.dueAt).getTime() < nowTime).length, 0)
}
