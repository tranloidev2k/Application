'use client'

import { useId, useState } from 'react'
import { Application, Status } from '../../../types'
import { todayKey } from '../../../utils/date'
import { NEEDS_APPLIED_DATE } from '../../../utils/status'
import { Field } from '../../../components/ui/Field'
import { Modal } from '../../../components/ui/Modal'
import { StatusPicker } from '../../../components/ui/StatusPicker'

export function StatusModal({ application, initialStatus, onClose, onSave }: { application: Application; initialStatus?: Status; onClose: () => void; onSave: (status: Status, appliedAt?: string) => void }) {
  const [status, setStatus] = useState<Status>(initialStatus ?? application.status)
  const [date, setDate] = useState(() => application.appliedAt || todayKey())
  const hintId = useId()
  const today = todayKey()
  const needsDate = NEEDS_APPLIED_DATE.includes(status)
  const unchanged = status === application.status
  const futureDate = needsDate && date > today
  const invalid = unchanged || (needsDate && (!date || futureDate))
  const submit = () => { if (!invalid) onSave(status, needsDate ? date : undefined) }
  return <Modal title="Cập nhật trạng thái" description="Chọn giai đoạn hiện tại của đơn ứng tuyển." onClose={onClose} onSubmit={submit} dirty={status !== (initialStatus ?? application.status)} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid} aria-describedby={unchanged ? hintId : undefined}>Lưu trạng thái</button></>}>
    <StatusPicker value={status} onChange={setStatus} autoFocusSelected={!initialStatus} />
    {needsDate && <Field label="Ngày ứng tuyển" required error={futureDate ? 'Ngày ứng tuyển không thể ở tương lai' : undefined}><input type="date" autoFocus={Boolean(initialStatus)} max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>}
    {unchanged && <p className="modal-hint" id={hintId}>Chọn trạng thái khác với hiện tại</p>}
  </Modal>
}
