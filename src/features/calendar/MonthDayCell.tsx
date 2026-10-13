import { Plus } from 'lucide-react'
import { formatWeekdayDate } from '../../utils/date'
import { CalendarDeadlineChip } from './CalendarDeadlineChip'
import { CalendarEventChip } from './CalendarEventChip'
import { calendarEventKey, CalendarDeadline, CalendarEvent, MONTH_CHIP_LIMIT, PopoverAnchor, sameCalendarEvent } from './calendarUtils'

export type MonthCellHandlers = {
  onCreate: (day: Date) => void
  onOpenEvent: (event: CalendarEvent, anchor: PopoverAnchor, opener: HTMLElement) => void
  onOpenDeadline: (deadline: CalendarDeadline, anchor: PopoverAnchor, opener: HTMLElement) => void
  onToggle: (event: CalendarEvent) => void
  /** '+N mục khác': lists every deadline and event of the day in a popover anchored to `opener`. */
  onMore: (day: Date, events: CalendarEvent[], deadlines: CalendarDeadline[], opener: HTMLElement) => void
}

/**
 * One day of the month grid. The day number sits at the top; a click on empty space (or the '+' button that shows on
 * hover and focus) opens 'Thêm việc' for that day. Deadlines come first (read-only, never draggable), then events. At
 * most MONTH_CHIP_LIMIT chips, deadlines included; with more items the last slot becomes '+N mục khác'. The cell is
 * the HTML5 drop target for event chips dragged from any cell.
 */
export function MonthDayCell({ day, dayKey, events, deadlines, overdue, outside, today, dropTarget, dragging, handlers, onDragOverDay, onDropDay, onDragStart, onDragEnd }: {
  day: Date
  dayKey: string
  events: CalendarEvent[]
  deadlines: CalendarDeadline[]
  /** The day is before today, so its deadlines have passed. */
  overdue: boolean
  outside: boolean
  today: boolean
  dropTarget: boolean
  dragging: CalendarEvent | null
  handlers: MonthCellHandlers
  onDragOverDay: (dayKey: string) => void
  onDropDay: (day: Date) => void
  onDragStart: (event: CalendarEvent) => void
  onDragEnd: () => void
}) {
  const total = deadlines.length + events.length
  const room = total > MONTH_CHIP_LIMIT ? MONTH_CHIP_LIMIT - 1 : total
  const shownDeadlines = deadlines.slice(0, room)
  const shownEvents = events.slice(0, room - shownDeadlines.length)
  const hidden = total - shownDeadlines.length - shownEvents.length
  return <div
    role="gridcell"
    className={`calendar-day ${outside ? 'outside' : ''} ${today ? 'today' : ''} ${dropTarget ? 'drop-target' : ''}`}
    onClick={() => handlers.onCreate(day)}
    onDragOver={drag => {
      if (!dragging) return
      drag.preventDefault()
      drag.dataTransfer.dropEffect = 'move'
      onDragOverDay(dayKey)
    }}
    onDrop={drop => {
      drop.preventDefault()
      if (dragging) onDropDay(day)
    }}
  >
    <div className="calendar-day-head">
      <span className="calendar-day-number">
        <span aria-hidden="true">{day.getDate()}</span>
        <span className="sr-only">{formatWeekdayDate(day)}{today ? ', hôm nay' : ''}</span>
      </span>
      <button
        type="button"
        className="calendar-day-add"
        aria-label={`Thêm việc ngày ${day.getDate()} tháng ${day.getMonth() + 1}`}
        title="Thêm việc"
        onClick={click => { click.stopPropagation(); handlers.onCreate(day) }}
      ><Plus size={15} aria-hidden="true" /></button>
    </div>
    <div className="calendar-day-events">
      {shownDeadlines.map(deadline => <CalendarDeadlineChip key={`deadline-${deadline.id}`} deadline={deadline} overdue={overdue} onOpen={handlers.onOpenDeadline} />)}
      {shownEvents.map(event => <CalendarEventChip
        key={calendarEventKey(event)}
        event={event}
        dragging={sameCalendarEvent(dragging, event)}
        onOpen={handlers.onOpenEvent}
        onToggle={handlers.onToggle}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />)}
      {hidden > 0 && <button
        type="button"
        className="calendar-more"
        aria-haspopup="menu"
        aria-label={`${hidden} mục khác ngày ${day.getDate()} tháng ${day.getMonth() + 1}`}
        onClick={click => { click.stopPropagation(); handlers.onMore(day, events, deadlines, click.currentTarget) }}
      >+{hidden} mục khác</button>}
    </div>
  </div>
}
