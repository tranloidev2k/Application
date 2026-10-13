'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Application, PersonalTask } from '../../types'
import type { ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import { useMinuteClock } from '../../hooks/useMinuteClock'
import { usePersonalTasks } from '../../hooks/usePersonalTasks'
import { calendarDateKey } from '../../utils/date'
import { uid } from '../../utils/id'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { CalendarTaskModal } from './CalendarTaskModal'
import { CalendarToolbar } from './CalendarToolbar'
import {
  CalendarEvent, calendarStateFromParams, CalendarView, monthGridDays, monthTitle, PopoverAnchor, weekDaysOf, weekTitle,
} from './calendarUtils'
import { DayEventsPopover } from './DayEventsPopover'
import { EventPopover } from './EventPopover'
import { MonthView } from './MonthView'
import { RescheduleModal } from './RescheduleModal'
import { useCalendarEvents } from './useCalendarEvents'
import { useCalendarMutations } from './useCalendarMutations'
import { WeekView } from './WeekView'

type EventPopoverState = { event: CalendarEvent; anchor: PopoverAnchor; opener: HTMLElement }
type DayListState = { day: Date; events: CalendarEvent[]; anchor: DOMRect; opener: HTMLElement }

const focusIfConnected = (element?: HTMLElement | null) => {
  if (element?.isConnected) element.focus({ preventScroll: true })
}
/** The default slot for a whole day: 09:00–09:45. */
const dayAtNine = (day: Date) => {
  const start = new Date(day)
  start.setHours(9, 0, 0, 0)
  return start
}

export function CalendarPage({ applications, ready, navigate, updateApplication, toast }: {
  applications: Application[]
  ready: boolean
  navigate: (path: string) => void
  updateApplication: UpdateApplicationFn
  toast: ToastFn
}) {
  const searchParams = useSearchParams()
  const [cursor, setCursor] = useState(() => calendarStateFromParams(searchParams).cursor)
  const [view, setView] = useState<CalendarView>(() => calendarStateFromParams(searchParams).view)
  const [creating, setCreating] = useState<{ start: Date; end: Date } | null>(null)
  const [popover, setPopover] = useState<EventPopoverState | null>(null)
  const [dayList, setDayList] = useState<DayListState | null>(null)
  const [rescheduling, setRescheduling] = useState<CalendarEvent | null>(null)
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<PersonalTask | null>(null)
  const now = useMinuteClock()
  const personalTasks = usePersonalTasks(toast)
  const { byDay } = useCalendarEvents(applications, personalTasks.tasks)
  const { toggleTask, moveEvent } = useCalendarMutations(personalTasks, updateApplication, toast)

  const todayKey = calendarDateKey(now)
  const weekDays = weekDaysOf(cursor)
  const visibleDays = view === 'month' ? monthGridDays(cursor) : weekDays
  const showingToday = view === 'month'
    ? cursor.getFullYear() === now.getFullYear() && cursor.getMonth() === now.getMonth()
    : todayKey >= calendarDateKey(visibleDays[0]) && todayKey <= calendarDateKey(visibleDays[visibleDays.length - 1])
  const title = view === 'month' ? monthTitle(cursor) : weekTitle(weekDays[0], weekDays[6])

  const setCalendarUrl = (nextView: CalendarView, nextCursor: Date) => {
    if (nextView === view && calendarDateKey(nextCursor) === calendarDateKey(cursor)) return
    const params = new URLSearchParams()
    params.set('view', nextView)
    params.set('date', calendarDateKey(nextCursor))
    window.history.pushState({}, '', `/calendar?${params}`)
    setView(nextView)
    setCursor(nextCursor)
  }
  const step = (direction: 1 | -1) => {
    const next = new Date(cursor)
    if (view === 'month') {
      // Keep the day of month, clamped to the target month's length (31 Jan + 1 month is 28/29 Feb, not 3 Mar).
      next.setDate(1)
      next.setMonth(next.getMonth() + direction)
      next.setDate(Math.min(cursor.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
    } else next.setDate(next.getDate() + direction * 7)
    setCalendarUrl(view, next)
  }

  useEffect(() => {
    const restoreCalendarState = () => {
      const state = calendarStateFromParams(new URLSearchParams(window.location.search))
      setView(state.view)
      setCursor(state.cursor)
    }
    window.addEventListener('popstate', restoreCalendarState)
    return () => window.removeEventListener('popstate', restoreCalendarState)
  }, [])

  const openCreate = useCallback((start: Date, end?: Date) => {
    setCreating({ start, end: end ?? new Date(start.getTime() + 45 * 60000) })
  }, [])
  const openCreateOnDay = useCallback((day: Date) => openCreate(dayAtNine(day)), [openCreate])
  const openEvent = useCallback((event: CalendarEvent, anchor: PopoverAnchor, opener: HTMLElement) => setPopover({ event, anchor, opener }), [])
  const openDayList = useCallback((day: Date, events: CalendarEvent[], opener: HTMLElement) => {
    setDayList({ day, events, anchor: opener.getBoundingClientRect(), opener })
  }, [])
  const monthHandlers = { onCreate: openCreateOnDay, onOpenEvent: openEvent, onToggle: toggleTask, onMore: openDayList }

  // Closing the popover hands focus back to the chip (or '+N mục khác') that opened it, before any dialog opens from it,
  // so that dialog in turn returns focus there.
  const closePopover = () => {
    focusIfConnected(popover?.opener)
    setPopover(null)
  }
  const fromPopover = (action: (event: CalendarEvent) => void) => () => {
    if (!popover) return
    const { event } = popover
    closePopover()
    action(event)
  }

  return <div className="page calendar-page">
    <section className="calendar-shell" aria-label="Lịch công việc">
      <CalendarToolbar
        view={view}
        title={title}
        showingToday={showingToday}
        onToday={() => setCalendarUrl(view, new Date())}
        onStep={step}
        onView={nextView => setCalendarUrl(nextView, cursor)}
        onAdd={() => openCreate(new Date())}
      />
      {view === 'month'
        ? <MonthView cursor={cursor} byDay={byDay} todayKey={todayKey} handlers={monthHandlers} onMove={moveEvent} />
        : <WeekView
          days={weekDays}
          byDay={byDay}
          now={now}
          ready={ready}
          onOpenEvent={openEvent}
          onCreateDay={openCreateOnDay}
          onCreateRange={openCreate}
          onSlot={start => openCreate(start)}
          onMove={moveEvent}
        />}
    </section>
    {dayList && <DayEventsPopover
      day={dayList.day}
      events={dayList.events}
      anchor={dayList.anchor}
      onClose={returnFocus => {
        if (returnFocus) focusIfConnected(dayList.opener)
        setDayList(null)
      }}
      onPick={(event, item) => {
        const rect = item.getBoundingClientRect()
        setDayList(null)
        setPopover({ event, anchor: { x: rect.right + 8, y: rect.top }, opener: dayList.opener })
      }}
    />}
    {popover && <EventPopover
      event={popover.event}
      anchor={popover.anchor}
      onClose={closePopover}
      onReschedule={fromPopover(setRescheduling)}
      onEdit={fromPopover(event => { if (event.personal) setEditingTask(event.personal) })}
      onDelete={fromPopover(event => { if (event.personal) setDeletingTask(event.personal) })}
      onOpenDetail={() => {
        const applicationId = popover.event.application?.id
        setPopover(null)
        if (applicationId) navigate(`/applications/${applicationId}`)
      }}
    />}
    {rescheduling && <RescheduleModal event={rescheduling} onClose={() => setRescheduling(null)} onSave={start => {
      moveEvent(rescheduling, start)
      setRescheduling(null)
    }} />}
    {creating && <CalendarTaskModal initialDate={creating.start} initialEndDate={creating.end} onClose={() => setCreating(null)} onSave={values => {
      void personalTasks.save({ id: uid(), ...values, updatedAt: new Date().toISOString() }, 'Đã thêm công việc vào lịch')
      setCreating(null)
    }} />}
    {editingTask && <CalendarTaskModal editing={editingTask} initialDate={new Date(editingTask.startsAt)} initialEndDate={new Date(editingTask.endsAt)} onClose={() => setEditingTask(null)} onSave={values => {
      void personalTasks.save({ ...editingTask, ...values, updatedAt: new Date().toISOString() }, 'Đã cập nhật công việc')
      setEditingTask(null)
    }} />}
    {deletingTask && <ConfirmModal
      title="Xóa công việc?"
      description={`Công việc “${deletingTask.title}” sẽ bị xóa khỏi lịch.`}
      confirmLabel="Xóa công việc"
      body={<div className="confirm-warning"><AlertCircle size={22} aria-hidden="true" /><p>Thao tác này không thể hoàn tác.</p></div>}
      onClose={() => setDeletingTask(null)}
      onConfirm={() => { void personalTasks.remove(deletingTask.id); setDeletingTask(null) }}
    />}
  </div>
}
