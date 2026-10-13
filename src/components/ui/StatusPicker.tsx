'use client'

import { KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { Status, STATUSES, STATUS_META } from '../../types'

const STEP = new Map([['ArrowRight', 1], ['ArrowDown', 1], ['ArrowLeft', -1], ['ArrowUp', -1]])

/**
 * Status chips with radio-group semantics: one tab stop (the selected chip), arrow keys and Home/End move the selection.
 * Name it with `labelledBy` (the id of a visible label) or it falls back to an aria-label.
 */
export function StatusPicker({ value, onChange, autoFocusSelected = false, labelledBy }: { value: Status; onChange: (status: Status) => void; autoFocusSelected?: boolean; labelledBy?: string }) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = STATUSES.indexOf(value)
    const step = STEP.get(event.key)
    const index = event.key === 'Home' ? 0
      : event.key === 'End' ? STATUSES.length - 1
        : step ? (current + step + STATUSES.length) % STATUSES.length
          : -1
    if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    if (index !== current) onChange(STATUSES[index])
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus()
  }
  return <div className="status-picker" role="radiogroup" aria-label={labelledBy ? undefined : 'Trạng thái đơn ứng tuyển'} aria-labelledby={labelledBy} onKeyDown={onKeyDown}>
    {STATUSES.map(status => {
      const meta = STATUS_META[status]
      const selected = value === status
      return <button type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} key={status} data-autofocus={autoFocusSelected && selected ? '' : undefined} className={`status-choice ${meta.tone} ${selected ? 'selected' : ''}`} onClick={() => onChange(status)}>
        <strong>{meta.label}</strong>
        {selected && <Check size={16} aria-hidden="true" />}
      </button>
    })}
  </div>
}
