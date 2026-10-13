'use client'

import { PointerEvent as ReactPointerEvent, RefObject, useEffect, useRef, useState } from 'react'
import { calendarDateKey } from '../../utils/date'
import { calendarEventEnd, CalendarEvent, DAY_MINUTES, HOUR_HEIGHT } from './calendarUtils'

export type WeekMovePreview = { event: CalendarEvent; start: Date; end: Date }
export type WeekCreatePreview = { day: Date; start: Date; end: Date }

const SNAP = 15
const DRAG_THRESHOLD = 4
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const snap = (minute: number) => Math.round(minute / SNAP) * SNAP
const atMinute = (day: Date, minute: number) => {
  const date = new Date(day)
  date.setHours(0, minute, 0, 0)
  return date
}

/**
 * Pointer drag in the week grid (00:00–24:00, 15-minute snap): drag an event to move it to another time or day, or
 * drag on empty column space to create a task over that range. Moves and creates start after a 4px threshold, so a
 * plain click still opens the popover or the slot modal; `wasDrag()` tells a click handler that the press was a drag.
 * Escape or pointercancel abandons the gesture. `columnsRef` must contain one `[data-week-column]` per day in `days`.
 */
export function useWeekPointer({ days, columnsRef, onMove, onCreate }: {
  days: Date[]
  columnsRef: RefObject<HTMLDivElement | null>
  onMove: (event: CalendarEvent, start: Date) => void
  onCreate: (start: Date, end: Date) => void
}) {
  const [movePreview, setMovePreview] = useState<WeekMovePreview | null>(null)
  const [createPreview, setCreatePreview] = useState<WeekCreatePreview | null>(null)
  const dragRef = useRef<{ event: CalendarEvent; grabOffset: number; originX: number; originY: number; started: boolean } | null>(null)
  const createRef = useRef<{ day: Date; originMinute: number; originX: number; originY: number; started: boolean } | null>(null)
  const movePreviewRef = useRef<WeekMovePreview | null>(null)
  const createPreviewRef = useRef<WeekCreatePreview | null>(null)
  const didDragRef = useRef(false)
  const latest = useRef({ days, onMove, onCreate })
  useEffect(() => { latest.current = { days, onMove, onCreate } })

  useEffect(() => {
    const clearMove = () => {
      dragRef.current = null
      movePreviewRef.current = null
      setMovePreview(null)
    }
    const clearCreate = () => {
      createRef.current = null
      createPreviewRef.current = null
      setCreatePreview(null)
    }
    const cancel = () => {
      clearMove()
      clearCreate()
      didDragRef.current = false
    }
    const onPointerMove = (pointer: PointerEvent) => {
      const move = dragRef.current
      const create = createRef.current
      const area = columnsRef.current
      if ((!move && !create) || !area) return
      const columns = Array.from(area.querySelectorAll<HTMLElement>('[data-week-column]'))
      if (create) {
        if (!create.started && Math.hypot(pointer.clientX - create.originX, pointer.clientY - create.originY) <= DRAG_THRESHOLD) return
        create.started = true
        didDragRef.current = true
        pointer.preventDefault()
        const column = columns.find(item => item.dataset.date === calendarDateKey(create.day))
        if (!column) return
        const pointerMinute = snap((pointer.clientY - column.getBoundingClientRect().top) / HOUR_HEIGHT * 60)
        const minute = clamp(pointerMinute, 0, DAY_MINUTES)
        const preview = {
          day: create.day,
          start: atMinute(create.day, Math.min(create.originMinute, minute)),
          end: atMinute(create.day, Math.min(DAY_MINUTES, Math.max(create.originMinute + SNAP, minute))),
        }
        createPreviewRef.current = preview
        setCreatePreview(preview)
        return
      }
      if (!move) return
      if (!move.started && Math.hypot(pointer.clientX - move.originX, pointer.clientY - move.originY) <= DRAG_THRESHOLD) return
      move.started = true
      didDragRef.current = true
      pointer.preventDefault()
      const index = columns.findIndex(column => {
        const rect = column.getBoundingClientRect()
        return pointer.clientX >= rect.left && pointer.clientX <= rect.right
      })
      const day = latest.current.days[index]
      if (index < 0 || !day) return
      const eventStart = new Date(move.event.startsAt)
      const durationMinutes = Math.max(SNAP, Math.round((calendarEventEnd(move.event).getTime() - eventStart.getTime()) / 60000))
      const pointerMinute = (pointer.clientY - columns[index].getBoundingClientRect().top - move.grabOffset) / HOUR_HEIGHT * 60
      // Any start from 00:00 to 23:45; a long event may then run past midnight, and the grid clips it at the day's end.
      const start = atMinute(day, clamp(snap(pointerMinute), 0, DAY_MINUTES - SNAP))
      const preview = { event: move.event, start, end: new Date(start.getTime() + durationMinutes * 60000) }
      movePreviewRef.current = preview
      setMovePreview(preview)
    }
    const onPointerUp = () => {
      const move = dragRef.current
      const preview = movePreviewRef.current
      const create = createRef.current
      let range = createPreviewRef.current
      if (create?.started && !range) {
        const start = atMinute(create.day, create.originMinute)
        range = { day: create.day, start, end: new Date(start.getTime() + SNAP * 60000) }
      }
      if (move?.started && preview && preview.start.getTime() !== new Date(preview.event.startsAt).getTime()) latest.current.onMove(preview.event, preview.start)
      if (create?.started && range) latest.current.onCreate(range.start, range.end)
      clearMove()
      clearCreate()
      // The click that ends this press fires before this timeout, so it still sees the flag; a later keyboard click does not.
      if (didDragRef.current) window.setTimeout(() => { didDragRef.current = false }, 0)
    }
    const onKeyDown = (keyboard: KeyboardEvent) => {
      if (keyboard.key === 'Escape' && (dragRef.current || createRef.current)) cancel()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [columnsRef])

  /** Pointer down on an event: arms a move (primary button only for a mouse). */
  const startMove = (pointer: ReactPointerEvent<HTMLElement>, event: CalendarEvent) => {
    if (pointer.pointerType === 'mouse' && pointer.button !== 0) return
    pointer.stopPropagation()
    didDragRef.current = false
    dragRef.current = { event, grabOffset: pointer.clientY - pointer.currentTarget.getBoundingClientRect().top, originX: pointer.clientX, originY: pointer.clientY, started: false }
  }

  /** Pointer down on empty column space: arms a create and shows a 15-minute slot under the pointer. */
  const startCreate = (pointer: ReactPointerEvent<HTMLElement>, day: Date) => {
    if (pointer.target !== pointer.currentTarget || (pointer.pointerType === 'mouse' && pointer.button !== 0)) return
    const offset = pointer.clientY - pointer.currentTarget.getBoundingClientRect().top
    const minute = clamp(snap(offset / HOUR_HEIGHT * 60), 0, DAY_MINUTES - SNAP)
    const start = atMinute(day, minute)
    const preview = { day, start, end: new Date(start.getTime() + SNAP * 60000) }
    didDragRef.current = false
    createRef.current = { day, originMinute: minute, originX: pointer.clientX, originY: pointer.clientY, started: false }
    createPreviewRef.current = preview
    setCreatePreview(preview)
  }

  /** For click handlers: true when the press that ends in this click moved or created something. */
  const wasDrag = () => didDragRef.current

  return { movePreview, createPreview, startMove, startCreate, wasDrag }
}
