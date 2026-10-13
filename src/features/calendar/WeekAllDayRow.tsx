import { calendarDateKey } from '../../utils/date'
import { CalendarDeadlineChip } from './CalendarDeadlineChip'
import { CalendarDeadline, PopoverAnchor } from './calendarUtils'

/**
 * The week's all-day row, under the day header: application deadlines on their date. It uses the same 72px axis +
 * one column per rendered day as the header and the time grid, so each deadline sits under its day.
 */
export function WeekAllDayRow({ days, deadlinesByDay, todayKey, onOpen }: {
  days: Date[]
  deadlinesByDay: Map<string, CalendarDeadline[]>
  todayKey: string
  onOpen: (deadline: CalendarDeadline, anchor: PopoverAnchor, opener: HTMLElement) => void
}) {
  return <div className="week-allday" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(100px, 1fr))` }}>
    <span className="week-allday-label">Cả ngày</span>
    {days.map(day => {
      const dayKey = calendarDateKey(day)
      return <div key={dayKey} className={`week-allday-cell ${dayKey === todayKey ? 'today' : ''}`}>
        {(deadlinesByDay.get(dayKey) ?? []).map(deadline => <CalendarDeadlineChip
          key={deadline.id}
          deadline={deadline}
          overdue={dayKey < todayKey}
          onOpen={onOpen}
        />)}
      </div>
    })}
  </div>
}
