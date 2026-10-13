'use client'

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useRef } from 'react'
import { ArrowRight, BriefcaseBusiness, CalendarClock, Clock3, ListTodo, NotebookPen, Pencil, Sparkles, Trash2, Video, X } from 'lucide-react'
import { formatDateTime, formatTime } from '../../utils/date'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { CalendarEvent, PopoverAnchor } from './calendarUtils'

const POPOVER_WIDTH = 348
const POPOVER_HEIGHT = 400
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
const KIND_HEADING = { interview: 'PHỎNG VẤN', personal: 'VIỆC CÁ NHÂN', task: 'CÔNG VIỆC' } as const

/**
 * Details of one calendar event, opened from a chip or a week block. It takes focus, keeps Tab inside, and closes on
 * Escape or a click outside (the caller returns focus to the opener). 'Đổi giờ' reschedules any kind without dragging.
 */
export function EventPopover({ event, anchor, onClose, onReschedule, onEdit, onDelete, onOpenDetail }: {
  event: CalendarEvent
  anchor: PopoverAnchor
  onClose: () => void
  onReschedule: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenDetail: () => void
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true })
    const closeOnEscape = (keyboard: KeyboardEvent) => {
      if (keyboard.key !== 'Escape' || document.querySelector('.modal')) return
      keyboard.preventDefault()
      onCloseRef.current()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const trapTab = (keyboard: ReactKeyboardEvent<HTMLDivElement>) => {
    if (keyboard.key !== 'Tab') return
    const focusable = Array.from(keyboard.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (keyboard.shiftKey ? active === first || active === keyboard.currentTarget : active === last) {
      keyboard.preventDefault()
      ;(keyboard.shiftKey ? last : first).focus()
    }
  }

  return <>
    <button type="button" tabIndex={-1} className="calendar-context-scrim" aria-label="Đóng thông tin sự kiện" onClick={onClose} onContextMenu={menu => { menu.preventDefault(); onClose() }} />
    <div
      ref={dialogRef}
      className="calendar-context-menu"
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      style={{ left: Math.max(12, Math.min(anchor.x, window.innerWidth - POPOVER_WIDTH)), top: Math.max(12, Math.min(anchor.y, window.innerHeight - POPOVER_HEIGHT)) }}
      onKeyDown={trapTab}
      onContextMenu={menu => menu.preventDefault()}
    >
      <div className="calendar-context-heading">
        <span className={`calendar-context-icon ${event.kind}`} aria-hidden="true">{event.kind === 'interview' ? <Video size={18} /> : <ListTodo size={18} />}</span>
        <div><small>{KIND_HEADING[event.kind]}</small><h3 id={titleId}>{event.title}</h3></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
      </div>
      <div className="calendar-context-details">
        <p><Clock3 size={17} aria-hidden="true" /><span><small>Thời gian</small><strong>{formatDateTime(event.startsAt)}{event.endsAt ? ` – ${formatTime(event.endsAt)}` : ''}</strong></span></p>
        {event.application && <>
          <p><BriefcaseBusiness size={17} aria-hidden="true" /><span><small>Ứng tuyển</small><strong>{event.application.jobTitle}</strong><em>{event.application.companyName}</em></span></p>
          <p><Sparkles size={17} aria-hidden="true" /><span><small>Trạng thái</small><StatusBadge status={event.application.status} /></span></p>
        </>}
        {event.note && <p><NotebookPen size={17} aria-hidden="true" /><span><small>Ghi chú</small><em>{event.note}</em></span></p>}
      </div>
      <div className={`calendar-context-buttons ${event.personal ? 'three' : ''}`}>
        <button type="button" className="secondary" onClick={onReschedule}><CalendarClock size={16} aria-hidden="true" /> Đổi giờ</button>
        {event.personal ? <>
          <button type="button" className="secondary" onClick={onEdit}><Pencil size={16} aria-hidden="true" /> Sửa</button>
          <button type="button" className="secondary danger-hover" onClick={onDelete}><Trash2 size={16} aria-hidden="true" /> Xóa</button>
        </> : event.application && <button type="button" className="primary calendar-context-action" onClick={onOpenDetail}>Mở trang chi tiết <ArrowRight size={17} aria-hidden="true" /></button>}
      </div>
    </div>
  </>
}
