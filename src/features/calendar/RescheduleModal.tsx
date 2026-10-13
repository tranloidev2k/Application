'use client'

import { useState } from 'react'
import { calendarDateKey, formatTime } from '../../utils/date'
import { Field } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { calendarEventEnd, CalendarEvent, KIND_LABEL } from './calendarUtils'

const pad2 = (value: number) => String(value).padStart(2, '0')
const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} phút`
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`
}

/**
 * 'Đổi giờ': a new date and start time for any event, keeping its duration. The non-drag way to reschedule, for
 * keyboard and touch users (WCAG 2.5.7).
 */
export function RescheduleModal({ event, onClose, onSave }: {
  event: CalendarEvent
  onClose: () => void
  onSave: (start: Date) => void
}) {
  const start = new Date(event.startsAt)
  const initialDate = calendarDateKey(start)
  const initialTime = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const durationMinutes = Math.max(1, Math.round((calendarEventEnd(event).getTime() - start.getTime()) / 60000))
  const target = date && time ? new Date(`${date}T${time}`) : null
  const invalid = !target || Number.isNaN(target.getTime())
  const dirty = date !== initialDate || time !== initialTime
  const newEnd = !invalid && target ? new Date(target.getTime() + durationMinutes * 60000) : null

  const submit = () => {
    if (invalid || !target) return
    if (!dirty) { onClose(); return }
    onSave(target)
  }

  return <Modal
    title="Đổi giờ"
    description={`${KIND_LABEL[event.kind]}: ${event.title}`}
    onClose={onClose}
    onSubmit={submit}
    dirty={dirty}
    footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={invalid}>Lưu thời gian</button></>}
  >
    <div className="form-grid">
      <div className="form-grid two">
        <Field label="Ngày" required error={!date ? 'Chọn ngày' : undefined}><input type="date" autoFocus value={date} onChange={change => setDate(change.target.value)} /></Field>
        <Field label="Giờ bắt đầu" required error={!time ? 'Chọn giờ bắt đầu' : undefined}><input type="time" step={300} value={time} onChange={change => setTime(change.target.value)} /></Field>
      </div>
      <p className="modal-hint reschedule-hint">
        Giữ nguyên thời lượng {durationLabel(durationMinutes)}{newEnd ? `, kết thúc lúc ${formatTime(newEnd)}${calendarDateKey(newEnd) !== date ? ' ngày hôm sau' : ''}` : ''}.
      </p>
    </div>
  </Modal>
}
