'use client'

import { useId, useState } from 'react'
import { MapPin, Phone, Video } from 'lucide-react'
import { Application, Interview, Status } from '../../../types'
import { todayKey, toLocalInputValue } from '../../../utils/date'
import { uid } from '../../../utils/id'
import { Field } from '../../../components/ui/Field'
import { Modal } from '../../../components/ui/Modal'

const HOUR_MS = 36e5
const TITLE_SUGGESTIONS = ['Vòng HR', 'Vòng chuyên môn', 'Vòng văn hóa', 'Vòng cuối']
/** Spec F05: an interview can exist before the status is INTERVIEW, but the UI suggests the update. */
const SUGGEST_INTERVIEW_FROM: Status[] = ['SAVED', 'APPLIED', 'SCREENING']
const PLACE_FIELDS = {
  online: { label: 'Link họp', placeholder: 'https://meet.google.com/...', type: 'url', icon: Video },
  onsite: { label: 'Địa chỉ', placeholder: 'Ví dụ: Tầng 5, 10 Phạm Văn Bạch, Cầu Giấy', type: 'text', icon: MapPin },
  phone: { label: 'Số điện thoại', placeholder: 'Ví dụ: 0901 234 567', type: 'tel', icon: Phone },
} as const

/** Tomorrow at the next full hour, but not before 09:00. */
function defaultStart() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, (now.getHours() + 1) % 24)
  if (start.getHours() < 9) start.setHours(9)
  return start
}

const timeOf = (value: string) => value ? new Date(value).getTime() : Number.NaN

/** Set when the dialog should also move the application to INTERVIEW in the same save; `appliedAt` only when it had none. */
export type InterviewStatusMove = { appliedAt?: string }

export function InterviewModal({ application, onClose, onSave }: { application: Application; onClose: () => void; onSave: (interview: Interview, move: InterviewStatusMove | null) => void }) {
  const [initial] = useState(() => {
    const start = defaultStart()
    return { start: toLocalInputValue(start), end: toLocalInputValue(new Date(start.getTime() + HOUR_MS)) }
  })
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [format, setFormat] = useState<Interview['format']>('online')
  const [place, setPlace] = useState('')
  const [interviewer, setInterviewer] = useState('')
  const canMove = SUGGEST_INTERVIEW_FROM.includes(application.status)
  const [moveToInterview, setMoveToInterview] = useState(true)
  const [appliedDate, setAppliedDate] = useState(() => todayKey())
  const suggestionsId = useId()
  const today = todayKey()

  const moving = canMove && moveToInterview
  const needsDate = moving && !application.appliedAt
  const futureDate = needsDate && appliedDate > today
  const endBeforeStart = Boolean(start && end && timeOf(end) <= timeOf(start))
  const invalid = !title.trim() || !start || !end || endBeforeStart || (needsDate && (!appliedDate || futureDate))
  const dirty = Boolean(title.trim() || place.trim() || interviewer.trim()) || start !== initial.start || end !== initial.end || format !== 'online'
  const placeField = PLACE_FIELDS[format]

  // Moving the start keeps the current duration (one hour when the range is not valid yet).
  const changeStart = (value: string) => {
    const duration = timeOf(end) - timeOf(start)
    setStart(value)
    const nextStart = timeOf(value)
    if (Number.isFinite(nextStart)) setEnd(toLocalInputValue(new Date(nextStart + (duration > 0 ? duration : HOUR_MS))))
  }

  const submit = () => {
    if (invalid) return
    onSave(
      { id: uid(), title: title.trim(), startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), timeZone: 'Asia/Ho_Chi_Minh', format, locationOrMeetingUrl: place.trim(), interviewer: interviewer.trim() },
      moving ? { appliedAt: needsDate ? appliedDate : undefined } : null,
    )
  }

  return <Modal title="Tạo lịch phỏng vấn" description={`${application.jobTitle} · ${application.companyName}`} onClose={onClose} onSubmit={submit} dirty={dirty} footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid}>Tạo lịch</button></>}>
    <div className="form-grid two">
      <Field label="Tên buổi phỏng vấn" required wide>
        <input autoFocus list={suggestionsId} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ví dụ: Vòng chuyên môn" />
        <datalist id={suggestionsId}>{TITLE_SUGGESTIONS.map(option => <option key={option} value={option} />)}</datalist>
      </Field>
      <Field label="Bắt đầu" required><input type="datetime-local" value={start} onChange={event => changeStart(event.target.value)} /></Field>
      <Field label="Kết thúc" required error={endBeforeStart ? 'Giờ kết thúc phải sau giờ bắt đầu' : undefined}><input type="datetime-local" value={end} onChange={event => setEnd(event.target.value)} /></Field>
      <Field label="Hình thức">
        <select value={format} onChange={event => setFormat(event.target.value as Interview['format'])}>
          <option value="online">Trực tuyến</option>
          <option value="onsite">Tại văn phòng</option>
          <option value="phone">Điện thoại</option>
        </select>
      </Field>
      <Field label={placeField.label}>
        {control => <div className="input-icon"><placeField.icon size={17} aria-hidden="true" /><input {...control} type={placeField.type} inputMode={format === 'phone' ? 'tel' : undefined} value={place} onChange={event => setPlace(event.target.value)} placeholder={placeField.placeholder} /></div>}
      </Field>
      <Field label="Người phỏng vấn" wide><input maxLength={120} value={interviewer} onChange={event => setInterviewer(event.target.value)} placeholder="Tên và chức danh (nếu có)" /></Field>
      {canMove && <label className="check-field wide">
        <input type="checkbox" checked={moveToInterview} onChange={event => setMoveToInterview(event.target.checked)} />
        <span>Chuyển trạng thái sang Phỏng vấn</span>
      </label>}
      {needsDate && <Field label="Ngày ứng tuyển" required wide error={futureDate ? 'Ngày ứng tuyển không thể ở tương lai' : undefined}>
        <input type="date" max={today} value={appliedDate} onChange={event => setAppliedDate(event.target.value)} />
      </Field>}
    </div>
  </Modal>
}
