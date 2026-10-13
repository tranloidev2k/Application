'use client'

import { useEffect, useRef } from 'react'
import { calendarDateKey, formatTime, formatWeekdayDate } from '../../utils/date'
import {
  calendarEventEnd, calendarEventKey, CalendarDeadline, CalendarEvent, DAY_MINUTES, DEFAULT_SCROLL_HOUR, HOUR_HEIGHT,
  minuteOfDay, PopoverAnchor, sameCalendarEvent, timezoneLabel, WEEK_GRID_HEIGHT, WEEKDAY_SHORT,
} from './calendarUtils'
import { useWeekPointer, WeekMovePreview } from './useWeekPointer'
import { WeekAllDayRow } from './WeekAllDayRow'
import { WeekCreateGhost, WeekEventButton, WeekMoveGhost } from './WeekEventBlock'
import { assignLanes, weekBlockGeometry } from './weekLayout'

const HOUR_LABELS = Array.from({ length: 23 }, (_, index) => index + 1)
const GRID_LINES = Array.from({ length: 24 }, (_, index) => index)
/** Hour labels closer than this to the now-pill are hidden so the two never overlap. */
const NOW_PILL_CLEARANCE = 14
const LABEL_CLEARANCE = 10

/**
 * One day's blocks in lanes. While an event is dragged it leaves its own day, and its ghost joins the target day's
 * layout (in the dragged event's place in the order when that is the same day), so the ghost starts exactly where the
 * event was and the drop lands where the ghost was drawn.
 */
const dayBlocks = (dayEvents: CalendarEvent[], movePreview: WeekMovePreview | null, previewHere: boolean) => {
  const ghost = movePreview && previewHere
    ? { key: 'move-preview', event: movePreview.event, preview: movePreview, ...weekBlockGeometry(movePreview.start, movePreview.end) }
    : null
  const items: { key: string; event: CalendarEvent; preview: WeekMovePreview | null; top: number; height: number; compact: boolean }[] = []
  let ghostPlaced = false
  for (const event of dayEvents) {
    if (sameCalendarEvent(movePreview?.event, event)) {
      if (ghost) { items.push(ghost); ghostPlaced = true }
      continue
    }
    items.push({ key: calendarEventKey(event), event, preview: null, ...weekBlockGeometry(new Date(event.startsAt), calendarEventEnd(event)) })
  }
  if (ghost && !ghostPlaced) items.push(ghost)
  return assignLanes(items)
}

/**
 * The time grid for `days`, 00:00–24:00. It opens scrolled to an hour before the earlier of the week's first event
 * and the current hour (07:00 when neither applies), once per week and again when the local data is ready.
 * A red line and time pill mark the current time on today's column.
 */
export function WeekView({ days, byDay, deadlinesByDay, now, ready, onOpenEvent, onOpenDeadline, onCreateDay, onCreateRange, onSlot, onMove }: {
  days: Date[]
  byDay: Map<string, CalendarEvent[]>
  /** Read-only, in the all-day row (shown when the week has any). */
  deadlinesByDay: Map<string, CalendarDeadline[]>
  now: Date
  /** The application cache has loaded, so the first event of the week is known. */
  ready: boolean
  onOpenEvent: (event: CalendarEvent, anchor: PopoverAnchor, opener: HTMLElement) => void
  onOpenDeadline: (deadline: CalendarDeadline, anchor: PopoverAnchor, opener: HTMLElement) => void
  onCreateDay: (day: Date) => void
  onCreateRange: (start: Date, end: Date) => void
  onSlot: (start: Date) => void
  onMove: (event: CalendarEvent, start: Date) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const columnsRef = useRef<HTMLDivElement>(null)
  const { movePreview, createPreview, startMove, startCreate, wasDrag } = useWeekPointer({ days, columnsRef, onMove, onCreate: onCreateRange })
  const dayKeys = days.map(day => calendarDateKey(day))
  const todayKey = calendarDateKey(now)
  const todayIndex = dayKeys.indexOf(todayKey)
  const hasDeadlines = dayKeys.some(key => deadlinesByDay.has(key))
  const nowTop = minuteOfDay(now) / 60 * HOUR_HEIGHT

  const weekEvents = dayKeys.flatMap(key => byDay.get(key) ?? [])
  const startHours = [
    ...(weekEvents.length ? [Math.min(...weekEvents.map(event => new Date(event.startsAt).getHours()))] : []),
    ...(todayIndex >= 0 ? [now.getHours()] : []),
  ]
  const openingHour = startHours.length ? Math.max(0, Math.min(...startHours) - 1) : DEFAULT_SCROLL_HOUR
  // A few pixels above the hour line, so that hour's label (centred on the line) is not cut off by the header.
  const initialScrollTop = Math.max(0, openingHour * HOUR_HEIGHT - LABEL_CLEARANCE)
  const scrollKey = `${dayKeys[0]}|${ready}`
  const scrolledKeyRef = useRef('')
  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller || scrolledKeyRef.current === scrollKey) return
    scrolledKeyRef.current = scrollKey
    scroller.scrollTop = initialScrollTop
  }, [scrollKey, initialScrollTop])

  const openSlot = (day: Date, offsetY: number) => {
    const minute = Math.max(0, Math.min(DAY_MINUTES - 15, Math.round(offsetY / HOUR_HEIGHT * 4) * 15))
    const start = new Date(day)
    start.setHours(0, minute, 0, 0)
    onSlot(start)
  }

  return <div className="week-calendar">
    <div className="week-header">
      <span className="week-timezone">{timezoneLabel(now)}</span>
      {days.map((day, index) => <button
        type="button"
        key={dayKeys[index]}
        className={index === todayIndex ? 'today' : ''}
        title={`Thêm việc ${formatWeekdayDate(day)}`}
        onClick={() => onCreateDay(day)}
      >
        <small>{WEEKDAY_SHORT[day.getDay()]}</small><strong>{day.getDate()}</strong><span className="sr-only">, thêm việc</span>
      </button>)}
    </div>
    {hasDeadlines && <WeekAllDayRow days={days} deadlinesByDay={deadlinesByDay} todayKey={todayKey} onOpen={onOpenDeadline} />}
    <div ref={scrollRef} className="week-scroll">
      <div className="week-time-axis" style={{ height: WEEK_GRID_HEIGHT }} aria-hidden="true">
        {HOUR_LABELS.map(hour => todayIndex >= 0 && Math.abs(hour * HOUR_HEIGHT - nowTop) < NOW_PILL_CLEARANCE
          ? null
          : <span key={hour} style={{ top: hour * HOUR_HEIGHT }}>{String(hour).padStart(2, '0')}:00</span>)}
        {todayIndex >= 0 && <span className="now-pill" style={{ top: nowTop }}>{formatTime(now)}</span>}
      </div>
      <div ref={columnsRef} className="week-columns" style={{ height: WEEK_GRID_HEIGHT }}>
        {days.map((day, index) => {
          const dayKey = dayKeys[index]
          const moveHere = !!movePreview && calendarDateKey(movePreview.start) === dayKey
          const createHere = createPreview && calendarDateKey(createPreview.day) === dayKey ? createPreview : null
          const blocks = dayBlocks(byDay.get(dayKey) ?? [], movePreview, moveHere)
          return <div
            key={dayKey}
            data-week-column
            data-date={dayKey}
            className={`week-column ${index === todayIndex ? 'today' : ''} ${moveHere || createHere ? 'drop-target' : ''}`}
            onPointerDown={pointer => startCreate(pointer, day)}
            onClick={click => { if (!wasDrag()) openSlot(day, click.clientY - click.currentTarget.getBoundingClientRect().top) }}
          >
            {GRID_LINES.map(hour => <span key={hour} className="week-hour-line" style={{ top: hour * HOUR_HEIGHT }} />)}
            {blocks.map(block => block.preview
              ? <WeekMoveGhost key={block.key} event={block.event} start={block.preview.start} end={block.preview.end} block={block} />
              : <WeekEventButton key={block.key} event={block.event} block={block} onPointerDown={startMove} onOpen={onOpenEvent} wasDrag={wasDrag} />)}
            {createHere && <WeekCreateGhost start={createHere.start} end={createHere.end} />}
          </div>
        })}
        {todayIndex >= 0 && <span className="current-time-line" style={{ top: nowTop, left: `calc(${todayIndex * 100 / days.length}% + 1px)`, width: `${100 / days.length}%` }} />}
      </div>
    </div>
  </div>
}
