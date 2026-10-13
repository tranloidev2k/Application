'use client'

import { useState } from 'react'
import { PersonalTask } from '../../types'
import { toLocalInputValue } from '../../utils/date'
import { Field } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { formatDuration } from './calendarUtils'

const timeOf = (value: string) => value ? new Date(value).getTime() : NaN

/**
 * 'Thêm công việc' / 'Sửa công việc' for a personal task. Moving the start keeps the current duration (45 minutes when
 * the range is not valid yet), and the duration is shown under 'Kết thúc'. A new task counts as unsaved work once it
 * has a title or a note; an edited one once any field differs.
 */
export function CalendarTaskModal({ initialDate, initialEndDate, editing, onClose, onSave }: {
  initialDate: Date
  initialEndDate: Date
  editing?: PersonalTask
  onClose: () => void
  onSave: (values: Pick<PersonalTask, 'title' | 'note' | 'startsAt' | 'endsAt'>) => void
}) {
  const [initial] = useState(() => ({ start: toLocalInputValue(initialDate), end: toLocalInputValue(initialEndDate) }))
  const [title, setTitle] = useState(editing?.title ?? '')
  const [dueAt, setDueAt] = useState(initial.start)
  const [endsAt, setEndsAt] = useState(initial.end)
  const [note, setNote] = useState(editing?.note ?? '')
  const durationMs = timeOf(endsAt) - timeOf(dueAt)
  const endBeforeStart = !!dueAt && !!endsAt && !(durationMs > 0)
  const invalid = !title.trim() || !dueAt || !endsAt || endBeforeStart
  const dirty = editing
    ? title !== editing.title || note !== (editing.note ?? '') || dueAt !== initial.start || endsAt !== initial.end
    : !!title.trim() || !!note.trim()

  const changeStart = (value: string) => {
    setDueAt(value)
    const nextStart = timeOf(value)
    if (Number.isFinite(nextStart)) setEndsAt(toLocalInputValue(new Date(nextStart + (durationMs > 0 ? durationMs : 45 * 60000))))
  }
  const submit = () => {
    if (invalid) return
    onSave({ title: title.trim(), note: note.trim() || undefined, startsAt: new Date(dueAt).toISOString(), endsAt: new Date(endsAt).toISOString() })
  }
  return <Modal title={editing ? 'Sửa công việc' : 'Thêm công việc'} onClose={onClose} onSubmit={submit} dirty={dirty} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid}>Lưu công việc</button></>}>
    <div className="form-grid">
      <Field label="Tên công việc" required><input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Ví dụ: Gửi portfolio cập nhật" /></Field>
      <div className="form-grid two">
        <Field label="Bắt đầu" required><input type="datetime-local" value={dueAt} onChange={event => changeStart(event.target.value)} /></Field>
        <Field
          label="Kết thúc"
          required
          hint={durationMs > 0 ? `Thời lượng: ${formatDuration(Math.round(durationMs / 60000))}` : undefined}
          error={endBeforeStart ? 'Giờ kết thúc phải sau giờ bắt đầu' : undefined}
        ><input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} /></Field>
      </div>
      <Field label="Ghi chú"><textarea rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Thông tin cần chuẩn bị..." /></Field>
    </div>
  </Modal>
}
