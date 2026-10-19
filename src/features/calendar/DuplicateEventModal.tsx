'use client'

import { useState } from 'react'
import { Clock3, ListTodo, Video } from 'lucide-react'
import { calendarDateKey, formatTime, formatWeekdayDate } from '../../utils/date'
import { eventColorClass } from '../../utils/eventColors'
import { Modal } from '../../components/ui/Modal'
import { calendarEventEnd, CalendarEvent, KIND_LABEL, WEEKDAY_SHORT } from './calendarUtils'
import { DuplicateDatePicker } from './DuplicateDatePicker'
import { dateFromKey, duplicatePresets, MAX_DUPLICATES } from './duplicateEvent'

const pad2 = (value: number) => String(value).padStart(2, '0')
const SUMMARY_LIMIT = 8
const shortDay = (key: string) => {
  const date = dateFromKey(key)
  return `${WEEKDAY_SHORT[date.getDay()]} ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`
}

/**
 * 'Nhân bản': pick any number of days (up to MAX_DUPLICATES) to copy an event onto, on a mini month calendar or with
 * quick presets. Each copy keeps the event's time of day and duration; `onSave` gets the chosen local date keys.
 */
export function DuplicateEventModal({ event, onClose, onSave }: {
  event: CalendarEvent
  onClose: () => void
  onSave: (dayKeys: string[]) => void
}) {
  const start = new Date(event.startsAt)
  const end = calendarEventEnd(event)
  const sourceKey = calendarDateKey(start)
  const [todayKey] = useState(() => calendarDateKey(new Date()))
  const [month, setMonth] = useState(() => new Date(start.getFullYear(), start.getMonth(), 1))
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const presets = duplicatePresets(sourceKey, todayKey)
  const count = selected.size
  const full = count >= MAX_DUPLICATES
  const sorted = [...selected].sort()

  const toggle = (key: string) => setSelected(current => {
    const next = new Set(current)
    if (next.has(key)) next.delete(key)
    else if (next.size < MAX_DUPLICATES && key !== sourceKey) next.add(key)
    return next
  })
  // A preset adds its days (up to the cap) and shows their month; when all of them are already picked it removes them.
  const applyPreset = (keys: string[]) => {
    const allPicked = keys.every(key => selected.has(key))
    const next = new Set(selected)
    for (const key of keys) {
      if (allPicked) next.delete(key)
      else if (next.size < MAX_DUPLICATES) next.add(key)
    }
    setSelected(next)
    if (!allPicked && keys[0]) setMonth(dateFromKey(keys[0]))
  }
  const submit = () => {
    if (count) onSave(sorted)
  }

  return <Modal
    title="Nhân bản sự kiện"
    description={`${KIND_LABEL[event.kind]}: ${event.title}`}
    onClose={onClose}
    onSubmit={submit}
    dirty={count > 0}
    footer={<><button type="button" className="secondary" onClick={onClose}>Hủy</button><button type="submit" className="primary" disabled={!count}>{count ? `Tạo ${count} bản sao` : 'Chọn ngày để nhân bản'}</button></>}
  >
    <div className="duplicate-event">
      <div className="duplicate-source">
        <span className={`calendar-context-icon ${event.kind} ${eventColorClass(event.color)}`} aria-hidden="true">{event.kind === 'interview' ? <Video size={18} /> : <ListTodo size={18} />}</span>
        <div>
          <strong>{event.title}</strong>
          <span><Clock3 size={14} aria-hidden="true" /> {formatWeekdayDate(start)} · {formatTime(start)}–{formatTime(end)}</span>
        </div>
      </div>
      <p className="modal-hint duplicate-hint">Chọn các ngày muốn tạo bản sao. Mỗi bản sao giữ nguyên tên, ghi chú, màu, giờ và thời lượng.</p>
      <div className="duplicate-presets" role="group" aria-label="Chọn nhanh">
        {presets.map(preset => <button
          key={preset.label}
          type="button"
          className="chip"
          aria-pressed={preset.keys.length > 0 && preset.keys.every(key => selected.has(key))}
          disabled={!preset.keys.length}
          onClick={() => applyPreset(preset.keys)}
        >{preset.label}</button>)}
      </div>
      <DuplicateDatePicker month={month} onMonth={setMonth} selected={selected} sourceKey={sourceKey} todayKey={todayKey} full={full} onToggle={toggle} />
      <div className="duplicate-summary">
        <p aria-live="polite">
          {count ? <><strong>Đã chọn {count} ngày</strong>{full ? ` · tối đa ${MAX_DUPLICATES} bản sao` : ''}</> : `Chưa chọn ngày nào (tối đa ${MAX_DUPLICATES}).`}
        </p>
        {count > 0 && <>
          <p className="duplicate-days">{sorted.slice(0, SUMMARY_LIMIT).map(shortDay).join(', ')}{count > SUMMARY_LIMIT ? ` và ${count - SUMMARY_LIMIT} ngày khác` : ''}</p>
          <button type="button" className="text-button" onClick={() => setSelected(new Set())}>Bỏ chọn tất cả</button>
        </>}
      </div>
    </div>
  </Modal>
}
