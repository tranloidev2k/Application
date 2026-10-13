'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Application, JobTask } from '../../types'
import type { SyncState, ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import { useDelayElapsed } from '../../hooks/useDelayElapsed'
import { useNow } from '../../hooks/useNow'
import { PageHeader } from '../../components/layout/PageHeader'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { ApplicationsTable } from './list/ApplicationsTable'
import { applicationLinkId } from './list/ApplicationRow'
import { PAGE_SIZE } from './list/applicationsQuery'
import { FilterBar } from './list/FilterBar'
import { FilteredEmpty } from './list/FilteredEmpty'
import { ListSkeleton } from './list/ListSkeleton'
import { OnboardingEmpty } from './list/OnboardingEmpty'
import { Pagination } from './list/Pagination'
import { StatusTabs } from './list/StatusTabs'
import { useApplicationsQuery } from './list/useApplicationsQuery'
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
  const list = useApplicationsQuery(applications, loading)
  const { requestStatusChange, statusModal } = useStatusChange(updateApplication, toast)
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

  return <div className="page applications-page">
    <PageHeader title="Đơn ứng tuyển" subtitle={subtitle} />
    {loading ? <ListSkeleton /> : !list.live.length ? <OnboardingEmpty /> : <>
      <FilterBar query={list.query} onQuery={list.setQuery} source={list.source} sources={list.sources} onSource={list.setSource} sort={list.sort} onSort={list.setSort} />
      <StatusTabs total={list.searchedCount} counts={list.statusCounts} selected={list.statuses} onChange={list.setStatuses} />
      {list.filtersActive && <div className="active-filter">
        <span>{list.filtered.length} kết quả phù hợp</span>
        <button type="button" onClick={list.clear}><X size={14} aria-hidden="true" /> Xóa bộ lọc</button>
      </div>}
      <section className="table-panel">
        {list.pageItems.length ? <>
          <ApplicationsTable items={list.pageItems} now={now} navigate={navigate} onStatusSelect={requestStatusChange} onAddNext={setTaskTarget} onDelete={setDeleteTarget} />
          <Pagination page={list.page} totalPages={list.totalPages} pageSize={PAGE_SIZE} total={list.filtered.length} onPage={list.setPage} />
        </> : <FilteredEmpty query={list.query} statuses={list.statuses} source={list.source} onClear={list.clear} />}
      </section>
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
