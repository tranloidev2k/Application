'use client'

import { useState } from 'react'
import { Field } from '../../../components/ui/Field'
import { Modal } from '../../../components/ui/Modal'

export function NoteModal({ onClose, onSave }: { onClose: () => void; onSave: (s: string) => void }) {
  const [text, setText] = useState('')
  const submit = () => { if (text.trim()) onSave(text.trim()) }
  return <Modal title="Thêm ghi chú" onClose={onClose} onSubmit={submit} dirty={Boolean(text.trim())} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={!text.trim()}>Thêm ghi chú</button></>}>
    <Field label="Nội dung" required><textarea autoFocus rows={5} maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder="Ghi lại nội dung trao đổi, điều cần nhớ..." /></Field>
  </Modal>
}
