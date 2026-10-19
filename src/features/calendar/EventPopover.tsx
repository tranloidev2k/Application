'use client'

import { ReactNode, useId } from 'react'
import {
  ArrowRight, BriefcaseBusiness, CalendarClock, Check, Clock3, Copy, ListTodo, NotebookPen, Palette, Pencil, RotateCcw,
  Sparkles, Trash2, Video, X,
} from 'lucide-react'
import { EventColor } from '../../types'
import { formatTime, formatWeekdayDate } from '../../utils/date'
import { eventColorClass, eventColorLabel } from '../../utils/eventColors'
import { isHttpUrl } from '../../utils/url'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { CalendarPopover } from './CalendarPopover'
import { calendarEventEnd, CalendarEvent, formatDuration, PopoverAnchor } from './calendarUtils'
import { EventColorPicker } from './EventColorPicker'
import { InterviewRows } from './InterviewRows'

const KIND_HEADING = { interview: 'PHỎNG VẤN', personal: 'VIỆC CÁ NHÂN', task: 'CÔNG VIỆC' } as const

/**
 * Details of one calendar event, opened from a chip or a week block. Interviews show their format, interviewer and
 * place, with 'Tham gia cuộc họp' for a meeting link (otherwise 'Sao chép địa chỉ' or 'Sao chép số điện thoại').
 * Tasks can be ticked off or reopened in place: `event` is the live version, so the popover follows the change.
 * 'Đổi giờ' reschedules any kind without dragging and 'Nhân bản' copies it onto other days. 'Màu' recolours any kind at once (the caller saves it and offers
 * 'Hoàn tác'). The first action takes focus on open.
 */
export function EventPopover({ event, anchor, onClose, onToggle, onCopy, onReschedule, onDuplicate, onEdit, onDelete, onOpenDetail, onColor }: {
  event: CalendarEvent
  anchor: PopoverAnchor
  onClose: () => void
  onToggle: () => void
  /** Copies an address (or a phone number); `what` names it in the toast. */
  onCopy: (text: string, what: string) => void
  onReschedule: () => void
  /** Opens 'Nhân bản' (copy the event onto other days). */
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenDetail: () => void
  onColor: (color: EventColor | undefined) => void
}) {
  const titleId = useId()
  const colorLabelId = useId()
  const start = new Date(event.startsAt)
  const end = calendarEventEnd(event)
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
  const place = event.interview?.locationOrMeetingUrl?.trim()
  const completed = !!event.completedAt

  let main: ReactNode = null
  if (event.kind !== 'interview') {
    main = <button type="button" className={completed ? 'secondary' : 'primary'} onClick={onToggle}>
      {completed ? <RotateCcw size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
      {completed ? 'Mở lại' : 'Đánh dấu hoàn thành'}
    </button>
  } else if (place && isHttpUrl(place)) {
    main = <a className="primary" href={place} target="_blank" rel="noopener noreferrer">
      <Video size={16} aria-hidden="true" /> Tham gia cuộc họp<span className="sr-only"> (mở trong tab mới)</span>
    </a>
  } else if (place) {
    const what = event.interview?.format === 'phone' ? 'số điện thoại' : 'địa chỉ'
    main = <button type="button" className="secondary" onClick={() => onCopy(place, what)}><Copy size={16} aria-hidden="true" /> Sao chép {what}</button>
  }

  return <CalendarPopover anchor={anchor} labelledBy={titleId} closeLabel="Đóng thông tin sự kiện" onClose={onClose}>
    <div className="calendar-context-heading">
      <span className={`calendar-context-icon ${event.kind} ${eventColorClass(event.color)}`} aria-hidden="true">{event.kind === 'interview' ? <Video size={18} /> : <ListTodo size={18} />}</span>
      <div>
        <small>{KIND_HEADING[event.kind]}{completed ? ' · ĐÃ HOÀN THÀNH' : ''}</small>
        <h3 id={titleId} className={completed ? 'completed' : ''}>{event.title}</h3>
      </div>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
    </div>
    <div className="calendar-context-details">
      <p><Clock3 size={17} aria-hidden="true" /><span>
        <small>Thời gian</small>
        <strong>{formatWeekdayDate(start)} · {formatTime(start)}–{formatTime(end)}{minutes > 0 && <span className="calendar-context-duration"> · {formatDuration(minutes)}</span>}</strong>
      </span></p>
      {event.interview && <InterviewRows interview={event.interview} />}
      {event.application && <>
        <p><BriefcaseBusiness size={17} aria-hidden="true" /><span><small>Ứng tuyển</small><strong>{event.application.jobTitle}</strong><em>{event.application.companyName}</em></span></p>
        <p><Sparkles size={17} aria-hidden="true" /><span><small>Trạng thái</small><StatusBadge status={event.application.status} /></span></p>
      </>}
      {event.note && <p><NotebookPen size={17} aria-hidden="true" /><span><small>Ghi chú</small><em>{event.note}</em></span></p>}
      <div className="calendar-context-color">
        <Palette size={17} aria-hidden="true" />
        <small><span id={colorLabelId}>Màu</span><span className="event-color-current" aria-hidden="true"> · {eventColorLabel(event.color)}</span></small>
        <EventColorPicker value={event.color} onChange={onColor} labelledBy={colorLabelId} selectOnFocus={false} />
      </div>
    </div>
    <div className="calendar-context-buttons">
      {main && <div className="calendar-context-main">{main}</div>}
      <div className="calendar-context-row two">
        <button type="button" className="secondary" onClick={onReschedule}><CalendarClock size={16} aria-hidden="true" /> Đổi giờ</button>
        <button type="button" className="secondary" onClick={onDuplicate}><Copy size={16} aria-hidden="true" /> Nhân bản</button>
        {event.personal ? <>
          <button type="button" className="secondary" onClick={onEdit}><Pencil size={16} aria-hidden="true" /> Sửa</button>
          <button type="button" className="secondary danger-hover" onClick={onDelete}><Trash2 size={16} aria-hidden="true" /> Xóa</button>
        </> : event.application && <button type="button" className={`calendar-context-wide ${main ? 'secondary' : 'primary'}`} onClick={onOpenDetail}>Mở trang chi tiết <ArrowRight size={17} aria-hidden="true" /></button>}
      </div>
    </div>
  </CalendarPopover>
}
