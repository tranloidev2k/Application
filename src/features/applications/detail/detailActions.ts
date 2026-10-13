import { Activity, Application, Interview, JobTask, Note } from '../../../types'
import type { ToastFn } from '../../../context/AppDataContext'
import { uid } from '../../../utils/id'
import { insertAt } from '../../../utils/list'
import { completeJobTask, undoCompleteJobTask } from '../../../utils/tasks'

/** updateApplication bound to the open application: the updater always receives the latest copy, so undo never restores a stale snapshot. */
export type ApplicationUpdate = (updater: (application: Application) => Application) => void

/**
 * Each sub-action below changes one item and offers 'Hoàn tác'. An undo only touches what its own action changed:
 * the item itself and the activity that action added. STATUS_CHANGED history is never removed.
 */

export function completeTaskWithUndo(update: ApplicationUpdate, toast: ToastFn, task: JobTask) {
  const activityId = uid()
  update(app => completeJobTask(app, task.id, new Date().toISOString(), activityId))
  toast('Đã hoàn thành công việc', {
    actionLabel: 'Hoàn tác',
    onAction: () => update(app => undoCompleteJobTask(app, task.id, activityId)),
  })
}

export function deleteTaskWithUndo(update: ApplicationUpdate, toast: ToastFn, taskId: string) {
  const removed: { task?: JobTask; index: number } = { index: -1 }
  update(app => {
    const index = app.tasks.findIndex(task => task.id === taskId)
    if (index < 0) return app
    removed.task = app.tasks[index]
    removed.index = index
    return { ...app, tasks: app.tasks.filter(task => task.id !== taskId) }
  })
  const { task, index } = removed
  if (!task) return
  toast('Đã xóa việc cần làm', {
    actionLabel: 'Hoàn tác',
    onAction: () => {
      update(app => app.tasks.some(item => item.id === task.id) ? app : { ...app, tasks: insertAt(app.tasks, index, task) })
      toast('Đã khôi phục việc cần làm')
    },
  })
}

export function cancelInterviewWithUndo(update: ApplicationUpdate, toast: ToastFn, interview: Interview) {
  const cancelledAt = new Date().toISOString()
  const activityId = uid()
  update(app => ({
    ...app,
    interviews: app.interviews.map(item => item.id === interview.id ? { ...item, cancelledAt } : item),
    activities: [{ id: activityId, type: 'INTERVIEW_CANCELLED', createdAt: cancelledAt, label: 'Đã hủy lịch phỏng vấn', detail: interview.title }, ...app.activities],
  }))
  toast('Đã hủy lịch phỏng vấn', {
    actionLabel: 'Hoàn tác',
    onAction: () => {
      // Not a status transition: the interview is simply active again and the cancel entry it added goes away.
      update(app => ({
        ...app,
        interviews: app.interviews.map(item => item.id === interview.id ? { ...item, cancelledAt: undefined } : item),
        activities: app.activities.filter(activity => activity.id !== activityId),
      }))
      toast('Đã khôi phục lịch phỏng vấn')
    },
  })
}

/** NOTE_ADDED activities written for `note`: the ones created with it, or (older data) every one with the same text. */
function noteActivityIndexes(activities: Activity[], note: Note) {
  const matching = activities.flatMap((activity, index) => activity.type === 'NOTE_ADDED' && activity.detail === note.content ? [index] : [])
  const sameTime = matching.filter(index => activities[index].createdAt === note.createdAt)
  return sameTime.length ? sameTime : matching
}

export function deleteNoteWithUndo(update: ApplicationUpdate, toast: ToastFn, noteId: string) {
  const removed: { note?: Note; index: number; activities: Array<{ activity: Activity; index: number }> } = { index: -1, activities: [] }
  update(app => {
    const index = app.appNotes.findIndex(note => note.id === noteId)
    if (index < 0) return app
    const note = app.appNotes[index]
    const linked = noteActivityIndexes(app.activities, note)
    removed.note = note
    removed.index = index
    removed.activities = linked.map(position => ({ activity: app.activities[position], index: position }))
    return {
      ...app,
      updatedAt: new Date().toISOString(),
      appNotes: app.appNotes.filter(item => item.id !== noteId),
      activities: app.activities.filter((_, position) => !linked.includes(position)),
    }
  })
  const { note, index, activities } = removed
  if (!note) return
  toast('Đã xóa ghi chú', {
    actionLabel: 'Hoàn tác',
    onAction: () => {
      update(app => {
        if (app.appNotes.some(item => item.id === note.id)) return app
        // Ascending original positions put every activity back exactly where it was.
        const restored = activities.reduce((list, entry) => list.some(item => item.id === entry.activity.id) ? list : insertAt(list, entry.index, entry.activity), app.activities)
        return { ...app, updatedAt: new Date().toISOString(), appNotes: insertAt(app.appNotes, index, note), activities: restored }
      })
      toast('Đã khôi phục ghi chú')
    },
  })
}
