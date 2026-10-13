'use client'

import { useId } from 'react'
import { Status } from '../../../types'
import { StatusPicker } from '../../../components/ui/StatusPicker'

/**
 * The status chips with a visible label. The label is a plain element referenced by aria-labelledby, never a <label>:
 * a click on a <label> would activate its first button and silently select 'Đã lưu'.
 */
export function StatusField({ value, onChange }: { value: Status; onChange: (status: Status) => void }) {
  const labelId = useId()
  return <div className="field wide status-field">
    <span className="field-label" id={labelId}>Trạng thái</span>
    <StatusPicker value={value} onChange={onChange} labelledBy={labelId} />
  </div>
}
