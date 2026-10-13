'use client'

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from 'react'
import { formatTime, formatWeekdayDate } from '../../utils/date'
import { calendarEventKey, CalendarEvent, eventAriaLabel } from './calendarUtils'

const MENU_WIDTH = 280
const EDGE = 8
const ITEM_HEIGHT = 40
const MENU_CHROME = 52 // heading, padding and border

/**
 * '+N mục khác': a menu of every event of one day, anchored to the button that opened it. Arrow keys, Home and End
 * move between items; Enter opens that event's popover; Escape, Tab or a click outside closes it.
 */
export function DayEventsPopover({ day, events, anchor, onPick, onClose }: {
  day: Date
  events: CalendarEvent[]
  /** The rect of the '+N mục khác' button, read when it was clicked. */
  anchor: DOMRect
  onPick: (event: CalendarEvent, item: HTMLElement) => void
  /** `returnFocus` is false when the menu closes because focus or a click went elsewhere. */
  onClose: (returnFocus: boolean) => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    const menu = menuRef.current
    menu?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true })
    const onPointerDown = (pointer: PointerEvent) => {
      if (!menu || menu.contains(pointer.target as Node)) return
      onCloseRef.current(false)
      // The click that ends this press only dismisses the menu: it must not also open 'Thêm việc' on a cell.
      const swallow = (click: Event) => {
        click.preventDefault()
        click.stopPropagation()
      }
      const release = () => window.setTimeout(() => document.removeEventListener('click', swallow, true), 0)
      document.addEventListener('click', swallow, true)
      document.addEventListener('pointerup', release, { capture: true, once: true })
      document.addEventListener('pointercancel', release, { capture: true, once: true })
      window.setTimeout(release, 1500)
    }
    // The menu is fixed to the viewport, so it closes when the grid or the window scrolls or resizes under it.
    const onViewportChange = (change: Event) => {
      if (change.type === 'scroll' && menu?.contains(change.target as Node)) return
      onCloseRef.current(!!menu?.contains(document.activeElement))
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [])

  const onKeyDown = (keyboard: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(keyboard.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    const index = items.indexOf(document.activeElement as HTMLElement)
    let next: number
    switch (keyboard.key) {
      case 'ArrowDown': next = (index + 1) % items.length; break
      case 'ArrowUp': next = (index - 1 + items.length) % items.length; break
      case 'Home': next = 0; break
      case 'End': next = items.length - 1; break
      case 'Escape':
        keyboard.preventDefault()
        keyboard.stopPropagation()
        onClose(true)
        return
      case 'Tab':
        onClose(true)
        return
      default:
        return
    }
    keyboard.preventDefault()
    items[next]?.focus()
  }

  const height = events.length * ITEM_HEIGHT + MENU_CHROME
  const left = Math.max(EDGE, Math.min(anchor.left, window.innerWidth - MENU_WIDTH - EDGE))
  const below = window.innerHeight - anchor.bottom - EDGE
  const position = below >= height || below >= anchor.top
    ? { top: anchor.bottom + 4 }
    : { bottom: window.innerHeight - anchor.top + 4 }
  const label = formatWeekdayDate(day)

  return <div ref={menuRef} className="menu day-events-menu" role="menu" aria-label={`Mọi mục ngày ${label}`} style={{ left, ...position }} onKeyDown={onKeyDown}>
    <p className="day-events-heading" aria-hidden="true">{label} · {events.length} mục</p>
    {events.map(event => <button
      key={calendarEventKey(event)}
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={`menu-item day-events-item ${event.kind} ${event.completedAt ? 'completed' : ''}`}
      aria-label={eventAriaLabel(event)}
      onClick={click => onPick(event, click.currentTarget)}
    >
      <span className="calendar-legend-dot" aria-hidden="true" />
      <time>{formatTime(event.startsAt)}</time>
      <span className="day-events-title">{event.title}</span>
    </button>)}
  </div>
}
