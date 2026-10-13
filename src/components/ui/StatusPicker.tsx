'use client'

import { Check } from 'lucide-react'
import { Status, STATUSES, STATUS_META } from '../../types'

export function StatusPicker({ value, onChange, autoFocusSelected = false }: { value: Status; onChange: (status: Status) => void; autoFocusSelected?: boolean }) {
  return <div className="status-picker" role="radiogroup" aria-label="Trạng thái đơn ứng tuyển">
    {STATUSES.map(status => {
      const meta = STATUS_META[status]
      const selected = value === status
      return <button type="button" role="radio" aria-checked={selected} key={status} data-autofocus={autoFocusSelected && selected ? '' : undefined} className={`status-choice ${meta.tone} ${selected ? 'selected' : ''}`} onClick={() => onChange(status)}>
        <strong>{meta.label}</strong>
        {selected && <Check size={16} />}
      </button>
    })}
  </div>
}
