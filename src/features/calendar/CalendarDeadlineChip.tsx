import { Flag } from 'lucide-react'
import { anchorOf, CalendarDeadline, deadlineAriaLabel, PopoverAnchor } from './calendarUtils'

/**
 * A SAVED application's deadline in a month cell or the week's all-day row: 'Hạn nộp · {company}', amber, red once
 * the day has passed. Read-only: a click (or Enter) opens its popover, it cannot be dragged, and clicks never reach
 * the cell underneath (so they never open 'Thêm việc').
 */
export function CalendarDeadlineChip({ deadline, overdue, onOpen }: {
  deadline: CalendarDeadline
  overdue: boolean
  onOpen: (deadline: CalendarDeadline, anchor: PopoverAnchor, opener: HTMLElement) => void
}) {
  const label = `Hạn nộp · ${deadline.application.companyName}`
  return <button
    type="button"
    className={`calendar-deadline ${overdue ? 'overdue' : ''}`}
    draggable={false}
    aria-label={deadlineAriaLabel(deadline, overdue)}
    title={`${label} — ${deadline.application.jobTitle}${overdue ? ' (đã quá hạn)' : ''}`}
    onPointerDown={pointer => pointer.stopPropagation()}
    onDragStart={drag => drag.preventDefault()}
    onClick={click => { click.stopPropagation(); onOpen(deadline, anchorOf(click), click.currentTarget) }}
  >
    <Flag size={12} strokeWidth={2.25} aria-hidden="true" />
    <span>{label}</span>
  </button>
}
