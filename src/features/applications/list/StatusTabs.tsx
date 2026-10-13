'use client'

import { Status, STATUSES, STATUS_META } from '../../../types'
import { IN_PROGRESS_STATUSES } from './applicationsQuery'

/**
 * Status filter chips with counts. A status chip toggles itself in the selection, 'Tất cả' clears it and
 * 'Đang tiến hành' selects the in-progress preset (or clears it when that is exactly the selection).
 */
export function StatusTabs({ total, counts, selected, onChange }: {
  total: number
  counts: Record<Status, number>
  selected: Status[]
  onChange: (statuses: Status[]) => void
}) {
  const chosen = new Set(selected)
  const inProgressCount = IN_PROGRESS_STATUSES.reduce((sum, status) => sum + counts[status], 0)
  const presetActive = selected.length === IN_PROGRESS_STATUSES.length && IN_PROGRESS_STATUSES.every(status => chosen.has(status))
  const toggle = (status: Status) => {
    const next = new Set(chosen)
    if (next.has(status)) next.delete(status)
    else next.add(status)
    onChange(STATUSES.filter(item => next.has(item)))
  }

  return <div className="status-tabs" role="group" aria-label="Lọc theo trạng thái">
    <button type="button" className="chip status-tab" aria-pressed={!selected.length} onClick={() => onChange([])}>
      Tất cả <span className="count-pill">{total}</span>
    </button>
    <button type="button" className="chip status-tab" aria-pressed={presetActive} onClick={() => onChange(presetActive ? [] : IN_PROGRESS_STATUSES)}>
      Đang tiến hành <span className="count-pill">{inProgressCount}</span>
    </button>
    <span className="status-tabs-divider" aria-hidden="true" />
    {STATUSES.map(status => {
      const meta = STATUS_META[status]
      return <button type="button" key={status} className={`chip status-tab ${meta.tone}`} aria-pressed={chosen.has(status)} onClick={() => toggle(status)}>
        <span className={`status-dot ${meta.tone}`} aria-hidden="true" />
        {meta.label} <span className="count-pill">{counts[status]}</span>
      </button>
    })}
  </div>
}
