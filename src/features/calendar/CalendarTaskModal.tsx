'use client'

import { useState } from 'react'
import { PersonalTask } from '../../types'
import { toInputDateTime } from '../../utils/date'
import { Field } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'

export function CalendarTaskModal({ initialDate, initialEndDate, editing, onClose, onSave }: {
  initialDate: Date
  initialEndDate: Date
  editing?: PersonalTask
  onClose: () => void
  onSave: (values: Pick<PersonalTask, 'title' | 'note' | 'startsAt' | 'endsAt'>) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [dueAt, setDueAt] = useState(toInputDateTime(initialDate.toISOString()))
  const [endsAt, setEndsAt] = useState(toInputDateTime(initialEndDate.toISOString()))
  const [note, setNote] = useState(editing?.note ?? '')
  const invalid = !title.trim() || !dueAt || !endsAt || new Date(endsAt) <= new Date(dueAt)
  const dirty = title !== (editing?.title ?? '') || note !== (editing?.note ?? '')
  const submit = () => {
    if (invalid) return
    onSave({ title: title.trim(), note: note.trim() || undefined, startsAt: new Date(dueAt).toISOString(), endsAt: new Date(endsAt).toISOString() })
  }
  return <Modal title={editing ? 'Sửa công việc' : 'Thêm công việc'} onClose={onClose} onSubmit={submit} dirty={dirty} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid}>Lưu công việc</button></>}>
    <div className="form-grid">
      <Field label="Tên công việc" required><input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Ví dụ: Gửi portfolio cập nhật" /></Field>
      <div className="form-grid two"><Field label="Bắt đầu" required><input type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} /></Field><Field label="Kết thúc" required error={dueAt && endsAt && new Date(endsAt) <= new Date(dueAt) ? 'Giờ kết thúc phải sau giờ bắt đầu' : undefined}><input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} /></Field></div>
      <Field label="Ghi chú"><textarea rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Thông tin cần chuẩn bị..." /></Field>
    </div>
  </Modal>
}
