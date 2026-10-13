'use client'

import { useMemo, useState } from 'react'
import { Application, JobTask } from '../../types'
import type { SyncState, ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import { useDelayElapsed } from '../../hooks/useDelayElapsed'
import { useNow } from '../../hooks/useNow'
import { PageHeader } from '../../components/layout/PageHeader'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { BoardSkeleton } from './board/BoardSkeleton'
import { BoardView } from './board/BoardView'
import { applicationLinkId } from './list/ApplicationRow'
import { FilterBar } from './list/FilterBar'
import { ListSkeleton } from './list/ListSkeleton'
import { ListView } from './list/ListView'
import { OnboardingEmpty } from './list/OnboardingEmpty'
import { useApplicationsQuery } from './list/useApplicationsQuery'
import { useApplicationsView } from './list/useApplicationsView'
import { ViewSwitch } from './list/ViewSwitch'
import { TaskModal } from './modals/TaskModal'
import { softDeleteApplication } from './softDeleteApplication'
import { useStatusChange } from './useStatusChange'

/** Longest the skeleton waits for the first sync of an empty cache before showing the first-run state. */
const SKELETON_CAP_MS = 5000

export function ApplicationsPage({ applications, navigate, updateApplication, toast, syncState, ready }: {
  applications: Application[]
  navigate: (to: string) => void
  updateApplication: UpdateApplicationFn
  toast: ToastFn
  syncState: SyncState
  ready: boolean
}) {
  const nowMs = useNow()
  const now = useMemo(() => new Date(nowMs), [nowMs])
  const skeletonCapped = useDelayElapsed(SKELETON_CAP_MS)
  const hasLive = useMemo(() => applications.some(app => !app.deletedAt), [applications])
  // Relative dates need the client clock (`nowMs` is 0 during SSR and hydration).
  const loading = !ready || !nowMs || (!hasLive && syncState === 'connecting' && !skeletonCapped)
  const [view, setView] = useApplicationsView()
  const board = view === 'board'
  const list = useApplicationsQuery(applications, loading, view)
  const { requestStatusChange, statusModal, pendingChange } = useStatusChange(updateApplication, toast)
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [taskTarget, setTaskTarget] = useState<Application | null>(null)

  const interviewCount = list.live.filter(app => app.status === 'INTERVIEW').length
  const offerCount = list.live.filter(app => app.status === 'OFFER').length
  const subtitle = !loading && list.live.length ? `${list.live.length} đơn · ${interviewCount} đang phỏng vấn · ${offerCount} offer` : undefined

  const addTask = (task: JobTask) => {
    if (!taskTarget) return
    const { id } = taskTarget
    const updatedAt = new Date().toISOString()
    updateApplication(id, app => ({ ...app, tasks: [task, ...app.tasks], updatedAt }))
    setTaskTarget(null)
    toast('Đã thêm việc cần làm')
    // The '+ Thêm bước tiếp theo' button that opened the dialog is replaced by the new task, so focus the row's title.
    window.requestAnimationFrame(() => document.getElementById(applicationLinkId(id))?.focus())
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    softDeleteApplication(deleteTarget.id, updateApplication, toast)
    setDeleteTarget(null)
  }

  return <div className={`page applications-page ${board ? 'board-mode' : ''}`}>
    <PageHeader title="Đơn ứng tuyển" subtitle={subtitle} action={!loading && list.live.length ? <ViewSwitch view={view} onChange={setView} /> : undefined} />
    {loading ? board ? <BoardSkeleton /> : <ListSkeleton /> : !list.live.length ? <OnboardingEmpty /> : <>
      <FilterBar query={list.query} onQuery={list.setQuery} source={list.source} sources={list.sources} onSource={list.setSource} sort={list.sort} onSort={list.setSort} />
      {board
        ? <BoardView list={list} now={now} navigate={navigate} onMove={requestStatusChange} pending={pendingChange} />
        : <ListView list={list} now={now} navigate={navigate} onStatusSelect={requestStatusChange} onAddNext={setTaskTarget} onDelete={setDeleteTarget} />}
    </>}
    {statusModal}
    {taskTarget && <TaskModal description={`${taskTarget.jobTitle} · ${taskTarget.companyName}`} onClose={() => setTaskTarget(null)} onSave={addTask} />}
    {deleteTarget && <ConfirmModal
      title="Xóa đơn ứng tuyển?"
      description={`Đơn “${deleteTarget.jobTitle}” tại ${deleteTarget.companyName} sẽ không còn xuất hiện trong danh sách và dashboard.`}
      onClose={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
    />}
  </div>
}
