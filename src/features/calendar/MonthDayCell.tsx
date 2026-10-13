import { Plus } from 'lucide-react'
import { formatWeekdayDate } from '../../utils/date'
import { CalendarEventChip } from './CalendarEventChip'
import { calendarEventKey, CalendarEvent, MONTH_CHIP_LIMIT, PopoverAnchor, sameCalendarEvent } from './calendarUtils'

export type MonthCellHandlers = {
  onCreate: (day: Date) => void
  onOpenEvent: (event: CalendarEvent, anchor: PopoverAnchor, opener: HTMLElement) => void
  onToggle: (event: CalendarEvent) => void
  /** '+N mục khác': lists every event of the day in a popover anchored to `opener`. */
  onMore: (day: Date, events: CalendarEvent[], opener: HTMLElement) => void
}

/**
 * One day of the month grid. The day number sits at the top; a click on empty space (or the '+' button that shows on
 * hover and focus) opens 'Thêm việc' for that day. At most MONTH_CHIP_LIMIT chips; with more events the last slot
 * becomes '+N mục khác'. The cell is the HTML5 drop target for chips dragged from any cell.
 */
export function MonthDayCell({ day, dayKey, events, outside, today, dropTarget, dragging, handlers, onDragOverDay, onDropDay, onDragStart, onDragEnd }: {
  day: Date
  dayKey: string
  events: CalendarEvent[]
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
  const overflow = events.length > MONTH_CHIP_LIMIT
  const shown = overflow ? events.slice(0, MONTH_CHIP_LIMIT - 1) : events
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
      {shown.map(event => <CalendarEventChip
        key={calendarEventKey(event)}
        event={event}
        dragging={sameCalendarEvent(dragging, event)}
        onOpen={handlers.onOpenEvent}
        onToggle={handlers.onToggle}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />)}
      {overflow && <button
        type="button"
        className="calendar-more"
        aria-haspopup="menu"
        aria-label={`${events.length - shown.length} mục khác ngày ${day.getDate()} tháng ${day.getMonth() + 1}`}
        onClick={click => { click.stopPropagation(); handlers.onMore(day, events, click.currentTarget) }}
      >+{events.length - shown.length} mục khác</button>}
    </div>
  </div>
}
