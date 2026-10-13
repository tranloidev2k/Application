import { Application } from '../types'

/** Open (not completed) tasks of live applications whose due time is before `now`. Client-only: depends on the clock. */
export function countOverdueTasks(applications: Application[], now: Date) {
  const nowTime = now.getTime()
  return applications.reduce((count, app) => app.deletedAt ? count
    : count + app.tasks.filter(task => !task.completedAt && task.dueAt && new Date(task.dueAt).getTime() < nowTime).length, 0)
}

/** Marks one task done and appends a TASK_COMPLETED activity (history is append-only). Shared by the detail page and the dashboard. */
export function completeJobTask(app: Application, taskId: string, completedAt: string, activityId: string): Application {
  const task = app.tasks.find(item => item.id === taskId)
  if (!task || task.completedAt) return app
  return {
    ...app,
    tasks: app.tasks.map(item => item.id === taskId ? { ...item, completedAt } : item),
    activities: [{ id: activityId, type: 'TASK_COMPLETED', createdAt: completedAt, label: 'Đã hoàn thành công việc', detail: task.title }, ...app.activities],
  }
}

/** Undo of completeJobTask within the same toast: reopens the task and drops only the activity that completion added. */
export function undoCompleteJobTask(app: Application, taskId: string, activityId: string): Application {
  return {
    ...app,
    tasks: app.tasks.map(item => item.id === taskId ? { ...item, completedAt: undefined } : item),
    activities: app.activities.filter(activity => activity.id !== activityId),
  }
}
