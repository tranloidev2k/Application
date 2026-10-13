'use client'

import { useState } from 'react'
import { calendarDateKey } from '../../utils/date'
import { CalendarDeadline, CalendarEvent, monthGridDays, monthTitle, WEEKDAY_HEADERS, WEEKDAY_NAMES } from './calendarUtils'
import { MonthCellHandlers, MonthDayCell } from './MonthDayCell'

const NO_DEADLINES: CalendarDeadline[] = []

/**
 * Six weeks of the month containing `cursor`. Chips move between days with HTML5 drag and drop (keeping their time
 * of day); the drag state lives here because only the month grid uses it. The weekday header is the grid's first row,
 * sticky while the weeks scroll under it.
 */
export function MonthView({ cursor, byDay, deadlinesByDay, todayKey, handlers, onMove }: {
  cursor: Date
  byDay: Map<string, CalendarEvent[]>
  deadlinesByDay: Map<string, CalendarDeadline[]>
  todayKey: string
  handlers: MonthCellHandlers
  onMove: (event: CalendarEvent, target: Date) => void
}) {
  const [dragging, setDragging] = useState<CalendarEvent | null>(null)
  const [dropKey, setDropKey] = useState('')
  const days = monthGridDays(cursor)
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7))
  const endDrag = () => {
    setDragging(null)
    setDropKey('')
  }
  const dropOn = (day: Date) => {
    if (!dragging) return
    const target = new Date(day)
    const source = new Date(dragging.startsAt)
    target.setHours(source.getHours(), source.getMinutes(), 0, 0)
    if (target.getTime() !== source.getTime()) onMove(dragging, target)
    endDrag()
  }

  return <div className="calendar-grid month" role="grid" aria-label={monthTitle(cursor)}>
    <div className="calendar-weekdays" role="row">
      {WEEKDAY_HEADERS.map((day, index) => <span key={day} role="columnheader" aria-label={WEEKDAY_NAMES[index]}>{day}</span>)}
    </div>
    {weeks.map(week => <div key={calendarDateKey(week[0])} role="row" className="calendar-week-row">
      {week.map(day => {
        const dayKey = calendarDateKey(day)
        return <MonthDayCell
          key={dayKey}
          day={day}
          dayKey={dayKey}
          events={byDay.get(dayKey) ?? []}
          deadlines={deadlinesByDay.get(dayKey) ?? NO_DEADLINES}
          overdue={dayKey < todayKey}
          outside={day.getMonth() !== cursor.getMonth()}
          today={dayKey === todayKey}
          dropTarget={dropKey === dayKey}
          dragging={dragging}
          handlers={handlers}
          onDragOverDay={key => { if (key !== dropKey) setDropKey(key) }}
          onDropDay={dropOn}
          onDragStart={setDragging}
          onDragEnd={endDrag}
        />
      })}
    </div>)}
  </div>
}
