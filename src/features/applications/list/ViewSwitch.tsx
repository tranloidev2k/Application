'use client'

import { Columns3, List } from 'lucide-react'
import type { ApplicationsView } from './useApplicationsView'

const VIEWS = [
  { value: 'list', label: 'Danh sách', icon: List },
  { value: 'board', label: 'Bảng', icon: Columns3 },
] as const

/** List or board: a segmented pair of toggle buttons in the page header. */
export function ViewSwitch({ view, onChange }: { view: ApplicationsView; onChange: (view: ApplicationsView) => void }) {
  return <div className="segmented view-switch" role="group" aria-label="Chế độ xem">
    {VIEWS.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={view === value} onClick={() => onChange(value)}>
      <Icon size={16} aria-hidden="true" />{label}
    </button>)}
  </div>
}
