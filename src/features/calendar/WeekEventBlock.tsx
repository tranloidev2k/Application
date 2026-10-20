import { PointerEvent as ReactPointerEvent } from 'react'
import { Video } from 'lucide-react'
import { formatTime } from '../../utils/date'
import { eventColorClass } from '../../utils/eventColors'
import { anchorOf, calendarEventEnd, CalendarEvent, eventAriaLabel, eventTimeRange, PopoverAnchor } from './calendarUtils'
import { laneStyle, WeekBlockGeometry, WeekBlockLane, weekBlockGeometry } from './weekLayout'

type WeekBlock = WeekBlockGeometry & WeekBlockLane

const subtitle = (event: CalendarEvent) => event.application?.companyName
/** Room for the third line (the company): 4px padding + three 16px lines. */
const SUBTITLE_HEIGHT = 52

/**
 * The face of a week block. 40 minutes or longer: the title, the time range '16:00–16:45' and the company. Shorter:
 * one line, 'Tiêu đề · 16:00'. The company is left out when it would not fit whole. Interviews carry a video icon
 * before the title.
 */
function WeekEventFace({ event, start, end, block }: { event: CalendarEvent; start: Date; end: Date; block: WeekBlock }) {
  const title = <strong>
    {event.kind === 'interview' && <Video size={12} strokeWidth={2.25} aria-hidden="true" />}
    <span>{event.title}</span>
  </strong>
  if (block.compact) return <>{title}<time>· {formatTime(start)}</time></>
  return <>{title}<time>{formatTime(start)}–{formatTime(end)}</time>{block.height >= SUBTITLE_HEIGHT && subtitle(event) && <small>{subtitle(event)}</small>}</>
}

/**
 * An event in a week column, in its lane, tinted by its picked colour (else its kind): a click (or Enter) opens the
 * popover, a pointer drag moves it.
 */
export function WeekEventButton({ event, block, onPointerDown, onOpen, wasDrag }: {
  event: CalendarEvent
  block: WeekBlock
  onPointerDown: (pointer: ReactPointerEvent<HTMLElement>, event: CalendarEvent) => void
  onOpen: (event: CalendarEvent, anchor: PopoverAnchor, opener: HTMLElement) => void
  wasDrag: () => boolean
}) {
  return <button
    type="button"
    className={`week-event ${event.kind} ${eventColorClass(event.color)} ${event.completedAt ? 'completed' : ''} ${block.compact ? 'compact' : ''}`}
    style={laneStyle(block)}
    aria-label={eventAriaLabel(event)}
    title={`${event.title} · ${eventTimeRange(event)}`}
    onPointerDown={pointer => onPointerDown(pointer, event)}
    onClick={click => {
      click.stopPropagation()
      if (!wasDrag()) onOpen(event, anchorOf(click), click.currentTarget)
    }}
  >
    <WeekEventFace event={event} start={new Date(event.startsAt)} end={calendarEventEnd(event)} block={block} />
  </button>
}

/** The ghost of an event being dragged, at its would-be time, laid out in the same lanes as the events it would join. */
export function WeekMoveGhost({ event, start, end, block }: { event: CalendarEvent; start: Date; end: Date; block: WeekBlock }) {
  return <span className={`week-event ${event.kind} ${eventColorClass(event.color)} move-preview ${block.compact ? 'compact' : ''}`} style={laneStyle(block)} aria-hidden="true">
    <WeekEventFace event={event} start={start} end={end} block={block} />
  </span>
}

/** The range being drawn for a new task (full column width, above the events). */
export function WeekCreateGhost({ start, end }: { start: Date; end: Date }) {
  const { top, height, compact } = weekBlockGeometry(start, end)
  return <span className={`week-event create-preview ${compact ? 'compact' : ''}`} style={{ top, height, left: 2, width: 'calc(100% - 4px)' }} aria-hidden="true">
    <strong><span>Công việc mới</span></strong><time>{compact ? '· ' : ''}{formatTime(start)}–{formatTime(end)}</time>
  </span>
}
