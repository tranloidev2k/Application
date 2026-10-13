'use client'

import { X } from 'lucide-react'
import { Application, Status } from '../../../types'
import { FilteredEmpty } from '../list/FilteredEmpty'
import type { ApplicationsQuery } from '../list/useApplicationsQuery'
import type { PendingStatusChange } from '../useStatusChange'
import { ApplicationBoard } from './ApplicationBoard'

/**
 * The board view below the filter bar. Only search, source and sort apply here: the list's status tabs and page are
 * not shown and do not filter the board, and 'Xóa bộ lọc' leaves them alone so the list comes back as it was.
 */
export function BoardView({ list, now, navigate, onMove, pending }: {
  list: ApplicationsQuery
  now: Date
  navigate: (to: string) => void
  onMove: (app: Application, status: Status) => void
  pending: PendingStatusChange | null
}) {
  return <>
    {list.searchActive && <div className="active-filter">
      <span>{list.boardItems.length} kết quả phù hợp</span>
      <button type="button" onClick={list.clearSearch}><X size={14} aria-hidden="true" /> Xóa bộ lọc</button>
    </div>}
    {list.boardItems.length
      ? <ApplicationBoard items={list.boardItems} now={now} navigate={navigate} onMove={onMove} pending={pending} />
      : <section className="table-panel"><FilteredEmpty query={list.query} statuses={[]} source={list.source} onClear={list.clearSearch} /></section>}
  </>
}
