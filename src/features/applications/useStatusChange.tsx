'use client'

import { useCallback, useState } from 'react'
import { Application, Status, STATUS_META } from '../../types'
import type { ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import { applyStatusChange, NEEDS_APPLIED_DATE } from '../../utils/status'
import { StatusModal } from './modals/StatusModal'

/** A status change waiting for its applied date in StatusModal. */
export type PendingStatusChange = { applicationId: string; status: Status }

/**
 * The shared status-change flow. requestStatusChange commits at once with an undo toast, or first asks for an
 * applied date when the target status needs one. Undo is a reverse transition appended to the immutable history.
 * Render `statusModal` at page level, never inside a clickable row/card or a <form>. `pendingChange` is the move
 * waiting on that dialog, so a view can preview it (the board's ghost card).
 */
export function useStatusChange(updateApplication: UpdateApplicationFn, toast: ToastFn) {
  const [request, setRequest] = useState<{ application: Application; status: Status } | null>(null)

  const commitStatusChange = useCallback((application: Application, status: Status, appliedAt?: string) => {
    const captured: { previous?: Pick<Application, 'status' | 'appliedAt'> } = {}
    updateApplication(application.id, current => {
      captured.previous = { status: current.status, appliedAt: current.appliedAt }
      return applyStatusChange(current, status, appliedAt)
    })
    const previous = captured.previous
    if (!previous) return
    toast(`Đã chuyển sang ${STATUS_META[status].label}`, {
      actionLabel: 'Hoàn tác',
      onAction: () => {
        updateApplication(application.id, current => ({ ...applyStatusChange(current, previous.status), appliedAt: previous.appliedAt }))
        toast(`Đã hoàn tác, trạng thái trở lại ${STATUS_META[previous.status].label}`)
      },
    })
  }, [updateApplication, toast])

  const requestStatusChange = useCallback((application: Application, status: Status) => {
    if (status === application.status) return
    if (NEEDS_APPLIED_DATE.includes(status) && !application.appliedAt) {
      setRequest({ application, status })
      return
    }
    commitStatusChange(application, status)
  }, [commitStatusChange])

  const statusModal = request ? <StatusModal
    application={request.application}
    initialStatus={request.status}
    onClose={() => setRequest(null)}
    onSave={(status, appliedAt) => {
      setRequest(null)
      commitStatusChange(request.application, status, appliedAt)
    }}
  /> : null

  const pendingChange: PendingStatusChange | null = request ? { applicationId: request.application.id, status: request.status } : null

  return { requestStatusChange, commitStatusChange, statusModal, pendingChange }
}
