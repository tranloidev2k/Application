'use client'

import { useId } from 'react'
import { ArrowRight, BriefcaseBusiness, CalendarClock, Flag, Sparkles, X } from 'lucide-react'
import { calendarDayDiff, formatDate } from '../../utils/date'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { CalendarPopover } from './CalendarPopover'
import { CalendarDeadline, PopoverAnchor, WEEKDAY_NAMES } from './calendarUtils'

/** 'Còn 3 ngày' | 'Hôm nay là hạn cuối' | 'Đã quá hạn 2 ngày'. */
const remainingLabel = (days: number) => {
  if (days > 0) return `Còn ${days} ngày`
  if (days === 0) return 'Hôm nay là hạn cuối'
  return `Đã quá hạn ${-days} ngày`
}

/**
 * A SAVED application's deadline: the date and how far away it is, the job, the company and the status, with
 * 'Mở trang chi tiết'. Read-only; it shares the event popover's placement, focus and close behaviour.
 */
export function DeadlinePopover({ deadline, now, anchor, onClose, onOpenDetail }: {
  deadline: CalendarDeadline
  now: Date
  anchor: PopoverAnchor
  onClose: () => void
  onOpenDetail: () => void
}) {
  const titleId = useId()
  const { application } = deadline
  const date = new Date(`${deadline.dayKey}T00:00:00`)
  const days = calendarDayDiff(date, now)
  return <CalendarPopover anchor={anchor} labelledBy={titleId} closeLabel="Đóng thông tin hạn nộp" onClose={onClose}>
    <div className="calendar-context-heading">
      <span className={`calendar-context-icon deadline ${days < 0 ? 'overdue' : ''}`} aria-hidden="true"><Flag size={18} /></span>
      <div><small>HẠN NỘP HỒ SƠ</small><h3 id={titleId}>Hạn nộp · {application.companyName}</h3></div>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
    </div>
    <div className="calendar-context-details">
      <p><CalendarClock size={17} aria-hidden="true" /><span>
        <small>Hạn nộp</small>
        <strong>{WEEKDAY_NAMES[date.getDay()]}, {formatDate(deadline.dayKey)}</strong>
        <em className={days < 0 ? 'calendar-context-overdue' : ''}>{remainingLabel(days)}</em>
      </span></p>
      <p><BriefcaseBusiness size={17} aria-hidden="true" /><span><small>Ứng tuyển</small><strong>{application.jobTitle}</strong><em>{application.companyName}</em></span></p>
      <p><Sparkles size={17} aria-hidden="true" /><span><small>Trạng thái</small><StatusBadge status={application.status} /></span></p>
    </div>
    <div className="calendar-context-buttons">
      <div className="calendar-context-main">
        <button type="button" className="primary" onClick={onOpenDetail}>Mở trang chi tiết <ArrowRight size={17} aria-hidden="true" /></button>
      </div>
    </div>
  </CalendarPopover>
}
