import { Check, Video } from 'lucide-react'
import { formatTime } from '../../utils/date'
import { eventColorClass } from '../../utils/eventColors'
import { anchorOf, CalendarEvent, eventAriaLabel, eventTimeRange, PopoverAnchor } from './calendarUtils'

/**
 * One event in a month cell: a separate check button for tasks, then the chip face. The face is a draggable
 * `div role="button"` (Firefox will not start an HTML5 drag from a native <button>); a click, Enter or Space opens the
 * event popover. Clicks never reach the cell, so they never open 'Thêm việc'. Interviews show a video icon in place of
 * the check button. A picked colour replaces the kind's tint (a completed chip stays muted).
 */
export function CalendarEventChip({ event, dragging, onOpen, onToggle, onDragStart, onDragEnd }: {
  event: CalendarEvent
  dragging: boolean
  onOpen: (event: CalendarEvent, anchor: PopoverAnchor, opener: HTMLElement) => void
  onToggle: (event: CalendarEvent) => void
  onDragStart: (event: CalendarEvent) => void
  onDragEnd: () => void
}) {
  const time = formatTime(event.startsAt)
  return <div className={`calendar-event-row ${event.kind} ${eventColorClass(event.color)} ${event.completedAt ? 'completed' : ''} ${dragging ? 'dragging' : ''}`} onClick={click => click.stopPropagation()}>
    {event.kind !== 'interview' && <button
      type="button"
      className="calendar-check"
      aria-pressed={!!event.completedAt}
      aria-label={`Đánh dấu hoàn thành: ${event.title}`}
      title={event.completedAt ? 'Mở lại' : 'Đánh dấu hoàn thành'}
      onClick={click => { click.stopPropagation(); onToggle(event) }}
    >
      <span className="calendar-check-box" aria-hidden="true">{event.completedAt && <Check size={11} strokeWidth={3} />}</span>
    </button>}
    <div
      className="calendar-event-face"
      role="button"
      tabIndex={0}
      aria-label={eventAriaLabel(event)}
      title={`${eventTimeRange(event)} ${event.title}`}
      draggable
      onClick={click => { click.stopPropagation(); onOpen(event, anchorOf(click), click.currentTarget) }}
      onKeyDown={key => {
        if (key.key !== 'Enter' && key.key !== ' ') return
        key.preventDefault()
        key.stopPropagation()
        onOpen(event, anchorOf(key), key.currentTarget)
      }}
      onDragStart={drag => {
        drag.stopPropagation()
        drag.dataTransfer.effectAllowed = 'move'
        drag.dataTransfer.setData('text/plain', `${event.kind}:${event.id}`)
        onDragStart(event)
      }}
      onDragEnd={onDragEnd}
    >
      {event.kind === 'interview' && <Video className="calendar-event-icon" size={12} strokeWidth={2.25} aria-hidden="true" />}
      <time>{time}</time>
      <strong>{event.title}</strong>
    </div>
  </div>
}
