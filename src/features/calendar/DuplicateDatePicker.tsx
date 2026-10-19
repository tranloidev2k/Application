'use client'

import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { calendarDateKey } from '../../utils/date'
import { addCalendarDays, monthGridDays, monthTitle, WEEKDAY_NAMES, WEEKDAY_SHORT } from './calendarUtils'
import { dateFromKey } from './duplicateEvent'

const pad2 = (value: number) => String(value).padStart(2, '0')
const STEP = new Map([['ArrowRight', 1], ['ArrowLeft', -1], ['ArrowDown', 7], ['ArrowUp', -7]])

/**
 * The mini month calendar of 'Nhân bản': each day is a toggle button (aria-pressed). Today is marked (aria-current),
 * the source event's own day is marked and cannot be picked, and once `full` no further day can be added. The days are
 * one tab stop: arrows move by day / week, Home / End to the start / end of the week, Page Up / Page Down by month,
 * and moving past the shown grid turns the month.
 */
export function DuplicateDatePicker({ month, onMonth, selected, sourceKey, todayKey, full, onToggle }: {
  /** Any date in the month shown. */
  month: Date
  onMonth: (month: Date) => void
  selected: ReadonlySet<string>
  sourceKey: string
  todayKey: string
  full: boolean
  onToggle: (key: string) => void
}) {
  const headingId = useId()
  const gridRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef(false)
  const [focusKey, setFocusKey] = useState(sourceKey)
  const days = monthGridDays(month)
  const keys = days.map(day => calendarDateKey(day))
  const firstOfMonth = calendarDateKey(new Date(month.getFullYear(), month.getMonth(), 1))
  const tabKey = keys.includes(focusKey) ? focusKey : firstOfMonth

  // After a keyboard move (which may have turned the month), focus the new day once it is rendered.
  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    gridRef.current?.querySelector<HTMLElement>(`[data-key="${focusKey}"]`)?.focus()
  }, [focusKey, month])

  const turn = (direction: 1 | -1) => onMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1))

  const onKeyDown = (keyboard: KeyboardEvent<HTMLDivElement>) => {
    if (keyboard.altKey || keyboard.ctrlKey || keyboard.metaKey) return
    const current = (document.activeElement as HTMLElement | null)?.dataset.key
    if (!current) return
    const date = dateFromKey(current)
    const step = STEP.get(keyboard.key)
    let next: Date | null = null
    if (step) next = addCalendarDays(date, step)
    else if (keyboard.key === 'Home') next = addCalendarDays(date, -date.getDay())
    else if (keyboard.key === 'End') next = addCalendarDays(date, 6 - date.getDay())
    else if (keyboard.key === 'PageUp' || keyboard.key === 'PageDown') {
      const direction = keyboard.key === 'PageUp' ? -1 : 1
      const lastDay = new Date(date.getFullYear(), date.getMonth() + direction + 1, 0).getDate()
      next = new Date(date.getFullYear(), date.getMonth() + direction, Math.min(date.getDate(), lastDay))
    }
    if (!next) return
    keyboard.preventDefault()
    const nextKey = calendarDateKey(next)
    pendingFocus.current = true
    setFocusKey(nextKey)
    if (!keys.includes(nextKey) || keyboard.key.startsWith('Page')) onMonth(next)
    else gridRef.current?.querySelector<HTMLElement>(`[data-key="${nextKey}"]`)?.focus()
  }

  return <div className="duplicate-calendar">
    <div className="duplicate-calendar-head">
      <button type="button" className="icon-button" onClick={() => turn(-1)} aria-label="Tháng trước"><ChevronLeft size={18} aria-hidden="true" /></button>
      <h3 id={headingId} aria-live="polite">{monthTitle(month)}</h3>
      <button type="button" className="icon-button" onClick={() => turn(1)} aria-label="Tháng sau"><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
    <div className="duplicate-calendar-weekdays" aria-hidden="true">{WEEKDAY_SHORT.map(name => <span key={name}>{name}</span>)}</div>
    <div ref={gridRef} className="duplicate-calendar-grid" role="group" aria-labelledby={headingId} onKeyDown={onKeyDown}>
      {days.map((day, index) => {
        const key = keys[index]
        const isSource = key === sourceKey
        const isSelected = selected.has(key)
        const blocked = isSource || (full && !isSelected)
        const label = `${WEEKDAY_NAMES[day.getDay()]}, ${pad2(day.getDate())}/${pad2(day.getMonth() + 1)}/${day.getFullYear()}${isSource ? ', ngày của sự kiện gốc' : ''}${key === todayKey ? ', hôm nay' : ''}`
        return <button
          key={key}
          type="button"
          data-key={key}
          className={['duplicate-day', day.getMonth() !== month.getMonth() ? 'outside' : '', key === todayKey ? 'today' : '', isSource ? 'source' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ')}
          aria-pressed={isSelected}
          aria-disabled={blocked || undefined}
          aria-current={key === todayKey ? 'date' : undefined}
          aria-label={label}
          title={isSource ? 'Ngày của sự kiện gốc' : full && !isSelected ? 'Đã đạt tối đa số bản sao' : undefined}
          tabIndex={key === tabKey ? 0 : -1}
          onFocus={() => setFocusKey(key)}
          onClick={() => { if (!blocked) onToggle(key) }}
        >
          <span>{day.getDate()}</span>
          {isSelected && <Check size={11} strokeWidth={3} aria-hidden="true" />}
        </button>
      })}
    </div>
  </div>
}
