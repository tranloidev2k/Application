import { Application, Status, STATUS_META } from '../types'
import { uid } from './id'

/** Statuses that only make sense once the application has been sent, so they require an applied date. */
export const NEEDS_APPLIED_DATE: Status[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']

/** The one status-change rule: new status, optional applied date, and an appended (never rewritten) STATUS_CHANGED activity. */
export function applyStatusChange(app: Application, status: Status, appliedAt?: string): Application {
  const now = new Date().toISOString()
  return {
    ...app,
    status,
    appliedAt: appliedAt || app.appliedAt,
    updatedAt: now,
    activities: [{ id: uid(), type: 'STATUS_CHANGED', createdAt: now, label: `Chuyển sang ${STATUS_META[status].label}`, detail: `Từ ${STATUS_META[app.status].label}` }, ...app.activities],
  }
}

/** Spec F07 "đơn đang hoạt động". SAVED is not sent yet; OFFER, REJECTED and WITHDRAWN are terminal. */
export const ACTIVE_STATUSES: Status[] = ['APPLIED', 'SCREENING', 'INTERVIEW']
export const isActiveApplication = (app: Application) => !app.deletedAt && ACTIVE_STATUSES.includes(app.status)

/** The forward pipeline the detail stepper and the board columns walk through. REJECTED and WITHDRAWN close an application. */
export const PIPELINE_STAGES: Status[] = ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']
export const CLOSED_STATUSES: Status[] = ['REJECTED', 'WITHDRAWN']
export const isClosedStatus = (status: Status) => CLOSED_STATUSES.includes(status)
/** The stage after `status` in the pipeline; null at OFFER and for a closed application. */
export function nextStage(status: Status): Status | null {
  const index = PIPELINE_STAGES.indexOf(status)
  return index >= 0 && index < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[index + 1] : null
}
