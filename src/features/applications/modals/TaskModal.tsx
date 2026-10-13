'use client'

import { useState } from 'react'
import { JobTask } from '../../../types'
import { uid } from '../../../utils/id'
import { Field } from '../../../components/ui/Field'
import { Modal } from '../../../components/ui/Modal'

export function TaskModal({ onClose, onSave }: { onClose: () => void; onSave: (t: JobTask) => void }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [note, setNote] = useState('')
  const submit = () => {
    if (!title.trim()) return
    onSave({ id: uid(), title: title.trim(), dueAt: due ? new Date(due).toISOString() : undefined, note })
  }
  return <Modal title="Thêm việc cần làm" onClose={onClose} onSubmit={submit} dirty={Boolean(title.trim() || due || note.trim())} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={!title.trim()}>Thêm việc</button></>}>
    <div className="form-grid"><Field label="Tên công việc" required><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Chuẩn bị portfolio" /></Field><Field label="Thời hạn"><input type="datetime-local" value={due} onChange={e => setDue(e.target.value)} /></Field><Field label="Ghi chú"><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} /></Field></div>
  </Modal>
}
