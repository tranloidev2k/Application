import { PointerEvent as ReactPointerEvent } from 'react'
import { formatTime } from '../../utils/date'
import { anchorOf, calendarEventEnd, CalendarEvent, eventAriaLabel, HOUR_HEIGHT, minuteOfDay, PopoverAnchor, WEEK_GRID_HEIGHT } from './calendarUtils'

const MIN_HEIGHT = 38

/** Top and height in the 00:00–24:00 column; the block never runs past the column's bottom (events may cross midnight). */
export function weekBlockGeometry(start: Date, end: Date, minHeight = MIN_HEIGHT) {
  const top = minuteOfDay(start) / 60 * HOUR_HEIGHT
  const height = Math.min(Math.max(minHeight, (end.getTime() - start.getTime()) / 3600000 * HOUR_HEIGHT), WEEK_GRID_HEIGHT - top)
  return { top, height, short: height < MIN_HEIGHT }
}

const subtitle = (event: CalendarEvent) => event.application?.companyName ?? 'Việc cá nhân'

/** An event in a week column: a click (or Enter) opens the popover, a pointer drag moves it. */
export function WeekEventButton({ event, onPointerDown, onOpen, wasDrag }: {
  event: CalendarEvent
  onPointerDown: (pointer: ReactPointerEvent<HTMLElement>, event: CalendarEvent) => void
  onOpen: (event: CalendarEvent, anchor: PopoverAnchor, opener: HTMLElement) => void
  wasDrag: () => boolean
}) {
  const start = new Date(event.startsAt)
  const { top, height, short } = weekBlockGeometry(start, calendarEventEnd(event))
  return <button
    type="button"
    className={`week-event ${event.kind} ${event.completedAt ? 'completed' : ''} ${short ? 'short' : ''}`}
    style={{ top, height }}
    aria-label={eventAriaLabel(event)}
    onPointerDown={pointer => onPointerDown(pointer, event)}
    onClick={click => {
      click.stopPropagation()
      if (!wasDrag()) onOpen(event, anchorOf(click), click.currentTarget)
    }}
  >
    <strong>{event.title}</strong><time>{formatTime(start)}</time><small>{subtitle(event)}</small>
  </button>
}

/** The ghost of an event being dragged, at its would-be time. */
export function WeekMoveGhost({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) {
  const { top, height, short } = weekBlockGeometry(start, end)
  return <span className={`week-event ${event.kind} move-preview ${short ? 'short' : ''}`} style={{ top, height }} aria-hidden="true">
    <strong>{event.title}</strong><time>{formatTime(start)}</time><small>{subtitle(event)}</small>
  </span>
}

/** The range being drawn for a new task. */
export function WeekCreateGhost({ start, end }: { start: Date; end: Date }) {
  const { top, height } = weekBlockGeometry(start, end, 18)
  return <span className="week-event create-preview" style={{ top, height }} aria-hidden="true">
    <strong>Công việc mới</strong><time>{formatTime(start)} – {formatTime(end)}</time>
  </span>
}
