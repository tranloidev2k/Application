'use client'

import { useState } from 'react'
import { Interview } from '../../../types'
import { toInputDateTime } from '../../../utils/date'
import { uid } from '../../../utils/id'
import { Field } from '../../../components/ui/Field'
import { Modal } from '../../../components/ui/Modal'

export function InterviewModal({ onClose, onSave }: { onClose: () => void; onSave: (i: Interview) => void }) {
  const [defaults] = useState(() => ({ start: toInputDateTime(new Date(Date.now() + 864e5).toISOString()), end: toInputDateTime(new Date(Date.now() + 90000000).toISOString()) }))
  const [title, setTitle] = useState('Phỏng vấn vòng chuyên môn')
  const [start, setStart] = useState(defaults.start)
  const [end, setEnd] = useState(defaults.end)
  const [format, setFormat] = useState<Interview['format']>('online')
  const [place, setPlace] = useState('')
  const [interviewer, setInterviewer] = useState('')
  const invalid = !title.trim() || !start || !end || new Date(end) <= new Date(start)
  const dirty = title !== 'Phỏng vấn vòng chuyên môn' || start !== defaults.start || end !== defaults.end || format !== 'online' || Boolean(place || interviewer)
  const submit = () => {
    if (invalid) return
    onSave({ id: uid(), title: title.trim(), startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), timeZone: 'Asia/Ho_Chi_Minh', format, locationOrMeetingUrl: place, interviewer })
  }
  return <Modal title="Tạo lịch phỏng vấn" onClose={onClose} onSubmit={submit} dirty={dirty} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid}>Tạo lịch</button></>}>
    <div className="form-grid two"><Field label="Tên buổi phỏng vấn" required wide><input value={title} onChange={e => setTitle(e.target.value)} /></Field><Field label="Bắt đầu" required><input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} /></Field><Field label="Kết thúc" required error={start && end && new Date(end) <= new Date(start) ? 'Giờ kết thúc phải sau giờ bắt đầu' : undefined}><input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></Field><Field label="Hình thức"><select value={format} onChange={e => setFormat(e.target.value as Interview['format'])}><option value="online">Trực tuyến</option><option value="onsite">Tại văn phòng</option><option value="phone">Điện thoại</option></select></Field><Field label="Địa điểm / Link họp"><input value={place} onChange={e => setPlace(e.target.value)} placeholder="Link Meet hoặc địa chỉ" /></Field><Field label="Người phỏng vấn" wide><input value={interviewer} onChange={e => setInterviewer(e.target.value)} placeholder="Tên và chức danh (nếu có)" /></Field></div>
  </Modal>
}
