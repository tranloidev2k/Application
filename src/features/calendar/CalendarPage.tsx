'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle, ArrowRight, BriefcaseBusiness, Check, ChevronLeft, ChevronRight, Clock3,
  ListTodo, NotebookPen, Pencil, Plus, Sparkles, Trash2, Video, X,
} from 'lucide-react'
import { Application, PersonalTask } from '../../types'
import type { ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import { usePersonalTasks } from '../../hooks/usePersonalTasks'
import { calendarDateKey, formatDate, formatDateTime, formatTime } from '../../utils/date'
import { uid } from '../../utils/id'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { addCalendarDays, CalendarEvent, calendarStateFromParams, CalendarView, startOfCalendarWeek } from './calendarUtils'
import { CalendarTaskModal } from './CalendarTaskModal'

export function CalendarPage({ applications, navigate, updateApplication, toast }: {
  applications: Application[]
  navigate: (path: string) => void
  updateApplication: UpdateApplicationFn
  toast: ToastFn
}) {
  const searchParams = useSearchParams()
  const [cursor, setCursor] = useState(() => calendarStateFromParams(searchParams).cursor)
  const [view, setView] = useState<CalendarView>(() => calendarStateFromParams(searchParams).view)
  const [createDate, setCreateDate] = useState<Date | null>(null)
  const [createEndDate, setCreateEndDate] = useState<Date | null>(null)
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null)
  const [dropTarget, setDropTarget] = useState('')
  const [weekMovePreview, setWeekMovePreview] = useState<{ event: CalendarEvent; start: Date; end: Date } | null>(null)
  const [weekCreatePreview, setWeekCreatePreview] = useState<{ day: Date; start: Date; end: Date } | null>(null)
  const [eventContext, setEventContext] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null)
  const weekColumnsRef = useRef<HTMLDivElement>(null)
  const weekDragRef = useRef<{ event: CalendarEvent; grabOffset: number; originX: number; originY: number; started: boolean } | null>(null)
  const weekCreateRef = useRef<{ day: Date; originMinute: number; originX: number; originY: number; started: boolean } | null>(null)
  const weekPreviewRef = useRef<{ event: CalendarEvent; start: Date; end: Date } | null>(null)
  const weekCreatePreviewRef = useRef<{ day: Date; start: Date; end: Date } | null>(null)
  const didWeekDragRef = useRef(false)
  const didWeekCreateRef = useRef(false)
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<PersonalTask | null>(null)
  const personalTasks = usePersonalTasks(toast)
  const activeApplications = applications.filter(application => !application.deletedAt)
  const currentDayKey = calendarDateKey(new Date())
  const events = useMemo<CalendarEvent[]>(() => [
    ...personalTasks.tasks.map(personal => ({
      id: personal.id,
      kind: 'personal' as const,
      title: personal.title,
      startsAt: personal.startsAt,
      endsAt: personal.endsAt,
      completedAt: personal.completedAt,
      note: personal.note,
      personal,
    })),
    ...activeApplications.flatMap(application => [
    ...application.tasks.filter(task => task.dueAt).map(task => ({
      id: task.id,
      kind: 'task' as const,
      title: task.title,
      startsAt: task.dueAt!,
      endsAt: task.endsAt,
      completedAt: task.completedAt,
      note: task.note,
      application,
      task,
    })),
    ...application.interviews.filter(interview => !interview.cancelledAt).map(interview => ({
      id: interview.id,
      kind: 'interview' as const,
      title: interview.title,
      startsAt: interview.startsAt,
      endsAt: interview.endsAt,
      application,
    })),
  ])].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [activeApplications, personalTasks.tasks])

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfCalendarWeek(monthStart)
  const monthDays = Array.from({ length: 42 }, (_, index) => addCalendarDays(gridStart, index))
  const weekStart = startOfCalendarWeek(cursor)
  const weekDays = Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStart, index))
  const visibleDays = view === 'month' ? monthDays : weekDays
  const title = view === 'month'
    ? new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(cursor)
    : `${formatDate(weekDays[0].toISOString())} – ${formatDate(weekDays[6].toISOString())}`
  const setCalendarUrl = (nextView: CalendarView, nextCursor: Date) => {
    const params = new URLSearchParams()
    params.set('view', nextView)
    params.set('date', calendarDateKey(nextCursor))
    window.history.pushState({}, '', `/calendar?${params}`)
    setView(nextView)
    setCursor(nextCursor)
  }
  const move = (direction: number) => {
    const next = new Date(cursor)
    if (view === 'month') next.setMonth(next.getMonth() + direction)
    else next.setDate(next.getDate() + direction * 7)
    setCalendarUrl(view, next)
  }
  const goToday = () => setCalendarUrl(view, new Date())
  const changeView = (nextView: CalendarView) => {
    if (nextView === view) return
    setCalendarUrl(nextView, cursor)
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
  useEffect(() => {
    if (!eventContext) return
    const closeOnEscape = (keyboard: KeyboardEvent) => {
      if (keyboard.key === 'Escape') setEventContext(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [eventContext])

  const openCreate = useCallback((date = new Date(), endDate?: Date) => {
    const due = new Date(date)
    if (due.getHours() === 0) due.setHours(9)
    setCreateDate(due)
    setCreateEndDate(endDate ?? new Date(due.getTime() + 45 * 60000))
  }, [])
  const toggleTask = (event: CalendarEvent) => {
    if (event.personal) {
      const completedAt = event.personal.completedAt ? undefined : new Date().toISOString()
      void personalTasks.save({ ...event.personal, completedAt, updatedAt: new Date().toISOString() }, completedAt ? 'Đã hoàn thành công việc' : 'Đã mở lại công việc')
      return
    }
    if (!event.task || !event.application) return
    const completedAt = event.task.completedAt ? undefined : new Date().toISOString()
    updateApplication(event.application.id, application => ({
      ...application,
      updatedAt: new Date().toISOString(),
      tasks: application.tasks.map(task => task.id === event.id ? { ...task, completedAt } : task),
    }))
    toast(completedAt ? 'Đã hoàn thành công việc' : 'Đã mở lại công việc')
  }

  const weekStartHour = 7
  const weekEndHour = 22
  const weekHourHeight = 64
  const weekHours = Array.from({ length: weekEndHour - weekStartHour + 1 }, (_, index) => weekStartHour + index)
  const now = new Date()
  const nowInVisibleWeek = calendarDateKey(now) >= calendarDateKey(weekDays[0]) && calendarDateKey(now) <= calendarDateKey(weekDays[6])
  const nowTop = ((now.getHours() + now.getMinutes() / 60) - weekStartHour) * weekHourHeight
  const openWeekSlot = (day: Date, offsetY: number) => {
    const minutes = Math.max(0, Math.min((weekEndHour - weekStartHour) * 60, Math.round(offsetY / weekHourHeight * 4) * 15))
    const due = new Date(day)
    due.setHours(weekStartHour + Math.floor(minutes / 60), minutes % 60, 0, 0)
    openCreate(due)
  }
  const moveCalendarEvent = useCallback((event: CalendarEvent, target: Date) => {
    const originalStart = new Date(event.startsAt)
    const application = event.application
    if (event.personal) {
      const duration = new Date(event.personal.endsAt).getTime() - originalStart.getTime()
      void personalTasks.save({ ...event.personal, startsAt: target.toISOString(), endsAt: new Date(target.getTime() + duration).toISOString(), updatedAt: new Date().toISOString() }, 'Đã chuyển lịch công việc')
    } else if (!application) {
      return
    } else if (event.kind === 'task') {
      const duration = event.endsAt ? new Date(event.endsAt).getTime() - originalStart.getTime() : 45 * 60000
      updateApplication(application.id, application => ({
        ...application,
        updatedAt: new Date().toISOString(),
        tasks: application.tasks.map(task => task.id === event.id ? { ...task, dueAt: target.toISOString(), endsAt: new Date(target.getTime() + duration).toISOString() } : task),
      }))
    } else {
      const duration = event.endsAt ? new Date(event.endsAt).getTime() - originalStart.getTime() : 60 * 60000
      updateApplication(application.id, application => ({
        ...application,
        updatedAt: new Date().toISOString(),
        interviews: application.interviews.map(interview => interview.id === event.id ? {
          ...interview,
          startsAt: target.toISOString(),
          endsAt: new Date(target.getTime() + duration).toISOString(),
        } : interview),
      }))
    }
    setDraggingEvent(null)
    setDropTarget('')
    if (!event.personal) toast(event.kind === 'task' ? 'Đã chuyển lịch công việc' : 'Đã chuyển lịch phỏng vấn')
  }, [personalTasks, toast, updateApplication])
  const moveToMonthDay = (event: CalendarEvent, day: Date) => {
    const source = new Date(event.startsAt)
    const target = new Date(day)
    target.setHours(source.getHours(), source.getMinutes(), 0, 0)
    moveCalendarEvent(event, target)
  }
  const weekDaysRef = useRef(weekDays)
  const moveCalendarEventRef = useRef(moveCalendarEvent)
  const openCreateRef = useRef(openCreate)
  useEffect(() => { weekDaysRef.current = weekDays }, [weekDays])
  useEffect(() => { moveCalendarEventRef.current = moveCalendarEvent }, [moveCalendarEvent])
  useEffect(() => { openCreateRef.current = openCreate }, [openCreate])

  useEffect(() => {
    const clearWeekDrag = () => {
      weekDragRef.current = null
      weekPreviewRef.current = null
      setWeekMovePreview(null)
    }
    const clearWeekCreate = () => {
      weekCreateRef.current = null
      weekCreatePreviewRef.current = null
      setWeekCreatePreview(null)
    }
    const cancelWeekDrag = () => {
      clearWeekDrag()
      clearWeekCreate()
      didWeekDragRef.current = false
      didWeekCreateRef.current = false
    }
    const onPointerMove = (pointer: PointerEvent) => {
      const active = weekDragRef.current
      const createActive = weekCreateRef.current
      const area = weekColumnsRef.current
      if ((!active && !createActive) || !area) return
      if (createActive) {
        const distance = Math.hypot(pointer.clientX - createActive.originX, pointer.clientY - createActive.originY)
        if (!createActive.started && distance <= 4) return
        createActive.started = true
        didWeekCreateRef.current = true
        pointer.preventDefault()
        const columns = Array.from(area.querySelectorAll<HTMLElement>('[data-week-column]'))
        const originColumn = columns.find(column => column.dataset.date === calendarDateKey(createActive.day))
        if (!originColumn) return
        const firstMinute = weekStartHour * 60
        const lastMinute = weekEndHour * 60
        const pointerMinute = firstMinute + (pointer.clientY - originColumn.getBoundingClientRect().top) / weekHourHeight * 60
        const snappedMinute = Math.max(firstMinute, Math.min(lastMinute, Math.round(pointerMinute / 15) * 15))
        const startMinute = Math.min(createActive.originMinute, snappedMinute)
        const endMinute = Math.min(lastMinute, Math.max(createActive.originMinute + 15, snappedMinute))
        const start = new Date(createActive.day)
        const end = new Date(createActive.day)
        start.setHours(0, startMinute, 0, 0)
        end.setHours(0, endMinute, 0, 0)
        const preview = { day: createActive.day, start, end }
        weekCreatePreviewRef.current = preview
        setWeekCreatePreview(preview)
        return
      }
      if (!active) return
      const distance = Math.hypot(pointer.clientX - active.originX, pointer.clientY - active.originY)
      if (!active.started && distance <= 4) return
      active.started = true
      didWeekDragRef.current = true
      pointer.preventDefault()

      const columns = Array.from(area.querySelectorAll<HTMLElement>('[data-week-column]'))
      const index = columns.findIndex(column => {
        const rect = column.getBoundingClientRect()
        return pointer.clientX >= rect.left && pointer.clientX <= rect.right
      })
      if (index < 0) return

      const column = columns[index]
      const columnTop = column.getBoundingClientRect().top
      const durationMinutes = Math.max(15, Math.round(((active.event.endsAt ? new Date(active.event.endsAt).getTime() : new Date(active.event.startsAt).getTime() + 45 * 60000) - new Date(active.event.startsAt).getTime()) / 60000))
      const firstMinute = weekStartHour * 60
      const lastMinute = weekEndHour * 60
      const pointerMinute = firstMinute + (pointer.clientY - columnTop - active.grabOffset) / weekHourHeight * 60
      const snappedMinute = Math.round(pointerMinute / 15) * 15
      const startMinute = Math.max(firstMinute, Math.min(snappedMinute, Math.max(firstMinute, lastMinute - durationMinutes)))
      const start = new Date(weekDaysRef.current[index])
      start.setHours(0, startMinute, 0, 0)
      const preview = { event: active.event, start, end: new Date(start.getTime() + durationMinutes * 60000) }
      weekPreviewRef.current = preview
      setWeekMovePreview(preview)
    }
    const onPointerUp = () => {
      const active = weekDragRef.current
      const preview = weekPreviewRef.current
      const createActive = weekCreateRef.current
      let createPreview = weekCreatePreviewRef.current
      if (createActive?.started && !createPreview) {
        const start = new Date(createActive.day)
        start.setHours(0, createActive.originMinute, 0, 0)
        createPreview = { day: createActive.day, start, end: new Date(start.getTime() + 15 * 60000) }
      }
      if (active?.started && preview) moveCalendarEventRef.current(preview.event, preview.start)
      if (createActive?.started && createPreview) openCreateRef.current(createPreview.start, createPreview.end)
      clearWeekDrag()
      clearWeekCreate()
    }
    const onKeyDown = (keyboard: KeyboardEvent) => {
      if (keyboard.key === 'Escape') cancelWeekDrag()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', cancelWeekDrag)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', cancelWeekDrag)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return <div className="page calendar-page">
    <section className="calendar-shell">
      <div className="calendar-toolbar">
        <div className="calendar-navigation">
          <button className="secondary today-button" onClick={goToday}>Hôm nay</button>
          <button className="icon-button" onClick={() => move(-1)} aria-label="Kỳ trước"><ChevronLeft size={20} /></button>
          <button className="icon-button" onClick={() => move(1)} aria-label="Kỳ sau"><ChevronRight size={20} /></button>
          {view === 'month' && <h2>{title}</h2>}
        </div>
        <div className="calendar-toolbar-actions">
          <div className="calendar-view-switch" aria-label="Kiểu hiển thị">
            <button className={view === 'month' ? 'active' : ''} onClick={() => changeView('month')}>Tháng</button>
            <button className={view === 'week' ? 'active' : ''} onClick={() => changeView('week')}>Tuần</button>
          </div>
          <button className="primary" onClick={() => openCreate()}><Plus size={18} /> Thêm việc</button>
        </div>
      </div>
      {view === 'month' ? <>
        <div className="calendar-weekdays" aria-hidden="true">
          {['CN', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'].map(day => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid month">
          {visibleDays.map(day => {
          const dayKey = calendarDateKey(day)
          const dayEvents = events.filter(event => calendarDateKey(event.startsAt) === dayKey)
          const outsideMonth = day.getMonth() !== cursor.getMonth()
          return <button key={dayKey} className={`calendar-day ${outsideMonth ? 'outside' : ''} ${dayKey === currentDayKey ? 'today' : ''} ${dropTarget === `month-${dayKey}` ? 'drop-target' : ''}`} onClick={() => openCreate(day)} onDragOver={drag => { if (!draggingEvent) return; drag.preventDefault(); drag.dataTransfer.dropEffect = 'move'; setDropTarget(`month-${dayKey}`) }} onDrop={drop => { drop.preventDefault(); if (draggingEvent) moveToMonthDay(draggingEvent, day) }}>
            <span className="calendar-day-number">{day.getDate()}</span>
            <span className="calendar-day-events">
              {dayEvents.slice(0, 4).map(event => <span
                key={`${event.kind}-${event.id}`}
                className={`calendar-event ${event.kind} ${event.completedAt ? 'completed' : ''} ${draggingEvent?.id === event.id && draggingEvent.kind === event.kind ? 'dragging' : ''}`}
                onClick={click => { click.stopPropagation(); setEventContext({ event, x: click.clientX, y: click.clientY }) }}
                draggable
                onDragStart={drag => { drag.stopPropagation(); drag.dataTransfer.effectAllowed = 'move'; drag.dataTransfer.setData('text/plain', `${event.kind}:${event.id}`); setDraggingEvent(event) }}
                onDragEnd={() => { setDraggingEvent(null); setDropTarget('') }}
              >
                {event.kind !== 'interview' && <span className={`calendar-check ${event.completedAt ? 'checked' : ''}`} onClick={click => { click.stopPropagation(); toggleTask(event) }}>{event.completedAt && <Check size={11} />}</span>}
                <time>{formatTime(event.startsAt)}</time>
                <strong>{event.title}</strong>
              </span>)}
              {dayEvents.length > 4 && <span className="calendar-more">+{dayEvents.length - 4} công việc</span>}
            </span>
          </button>
          })}
        </div>
      </> : <div className="week-calendar">
        <div className="week-header">
          <span className="week-timezone">GMT+7</span>
          {weekDays.map((day, index) => <button key={calendarDateKey(day)} className={calendarDateKey(day) === currentDayKey ? 'today' : ''} onClick={() => openCreate(day)}>
            <small>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][index]}</small><strong>{day.getDate()}</strong>
          </button>)}
        </div>
        <div className="week-scroll">
          <div className="week-time-axis">
            {weekHours.map(hour => <span key={hour} style={{ top: (hour - weekStartHour) * weekHourHeight }}>{String(hour).padStart(2, '0')}:00</span>)}
          </div>
          <div ref={weekColumnsRef} className="week-columns" style={{ height: (weekEndHour - weekStartHour) * weekHourHeight }}>
            {weekDays.map(day => {
              const dayKey = calendarDateKey(day)
              const previewOnDay = weekMovePreview && calendarDateKey(weekMovePreview.start) === dayKey ? weekMovePreview : null
              const createPreviewOnDay = weekCreatePreview && calendarDateKey(weekCreatePreview.day) === dayKey ? weekCreatePreview : null
              const dayEvents = events.filter(event => calendarDateKey(event.startsAt) === dayKey && !(weekMovePreview && weekMovePreview.event.id === event.id && weekMovePreview.event.kind === event.kind))
              return <div data-week-column data-date={dayKey} key={dayKey} className={`week-column ${dayKey === currentDayKey ? 'today' : ''} ${previewOnDay || createPreviewOnDay ? 'drop-target' : ''}`} onPointerDown={pointer => {
                if (pointer.target !== pointer.currentTarget || (pointer.pointerType === 'mouse' && pointer.button !== 0)) return
                const firstMinute = weekStartHour * 60
                const lastMinute = weekEndHour * 60
                const offset = pointer.clientY - pointer.currentTarget.getBoundingClientRect().top
                const minute = Math.max(firstMinute, Math.min(lastMinute - 15, Math.round((firstMinute + offset / weekHourHeight * 60) / 15) * 15))
                const start = new Date(day)
                start.setHours(0, minute, 0, 0)
                const preview = { day, start, end: new Date(start.getTime() + 15 * 60000) }
                didWeekDragRef.current = false
                didWeekCreateRef.current = false
                weekCreateRef.current = { day, originMinute: minute, originX: pointer.clientX, originY: pointer.clientY, started: false }
                weekCreatePreviewRef.current = preview
                setWeekCreatePreview(preview)
              }} onClick={click => { if (!didWeekDragRef.current && !didWeekCreateRef.current) openWeekSlot(day, click.clientY - click.currentTarget.getBoundingClientRect().top) }}>
                {weekHours.slice(0, -1).map(hour => <span key={hour} className="week-hour-line" style={{ top: (hour - weekStartHour) * weekHourHeight }} />)}
                {dayEvents.map(event => {
                  const start = new Date(event.startsAt)
                  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 45 * 60000)
                  const top = Math.max(0, ((start.getHours() + start.getMinutes() / 60) - weekStartHour) * weekHourHeight)
                  const height = Math.max(38, Math.min(120, (end.getTime() - start.getTime()) / 3600000 * weekHourHeight))
                  if (start.getHours() < weekStartHour || start.getHours() >= weekEndHour) return null
                  return <button key={`${event.kind}-${event.id}`} className={`week-event ${event.kind} ${event.completedAt ? 'completed' : ''}`} style={{ top, height }} onPointerDown={pointer => { if (pointer.pointerType === 'mouse' && pointer.button !== 0) return; pointer.stopPropagation(); const rect = pointer.currentTarget.getBoundingClientRect(); didWeekDragRef.current = false; weekDragRef.current = { event, grabOffset: pointer.clientY - rect.top, originX: pointer.clientX, originY: pointer.clientY, started: false } }} onClick={click => { click.stopPropagation(); if (!didWeekDragRef.current) setEventContext({ event, x: click.clientX, y: click.clientY }) }}>
                    <strong>{event.title}</strong><time>{formatTime(start)}</time><small>{event.application?.companyName ?? 'Việc cá nhân'}</small>
                  </button>
                })}
                {previewOnDay && (() => {
                  const top = ((previewOnDay.start.getHours() + previewOnDay.start.getMinutes() / 60) - weekStartHour) * weekHourHeight
                  const height = Math.max(38, Math.min(120, (previewOnDay.end.getTime() - previewOnDay.start.getTime()) / 3600000 * weekHourHeight))
                  return <span className={`week-event ${previewOnDay.event.kind} move-preview`} style={{ top, height }}><strong>{previewOnDay.event.title}</strong><time>{formatTime(previewOnDay.start)}</time><small>{previewOnDay.event.application?.companyName ?? 'Việc cá nhân'}</small></span>
                })()}
                {createPreviewOnDay && (() => {
                  const top = ((createPreviewOnDay.start.getHours() + createPreviewOnDay.start.getMinutes() / 60) - weekStartHour) * weekHourHeight
                  const height = Math.max(18, (createPreviewOnDay.end.getTime() - createPreviewOnDay.start.getTime()) / 3600000 * weekHourHeight)
                  return <span className="week-event create-preview" style={{ top, height }}><strong>Công việc mới</strong><time>{formatTime(createPreviewOnDay.start)} – {formatTime(createPreviewOnDay.end)}</time></span>
                })()}
              </div>
            })}
            {nowInVisibleWeek && nowTop >= 0 && nowTop <= (weekEndHour - weekStartHour) * weekHourHeight && <span className="current-time-line" style={{ top: nowTop, left: `calc(${now.getDay() * (100 / 7)}% + 1px)`, width: `${100 / 7}%` }} />}
          </div>
        </div>
      </div>}
    </section>
    {eventContext && <>
      <button className="calendar-context-scrim" aria-label="Đóng thông tin sự kiện" onClick={() => setEventContext(null)} onContextMenu={menu => { menu.preventDefault(); setEventContext(null) }} />
      <div className="calendar-context-menu" role="dialog" aria-label="Chi tiết sự kiện" style={{ left: Math.max(12, Math.min(eventContext.x, window.innerWidth - 348)), top: Math.max(12, Math.min(eventContext.y, window.innerHeight - 390)) }} onContextMenu={menu => menu.preventDefault()}>
        <div className="calendar-context-heading">
          <span className={`calendar-context-icon ${eventContext.event.kind}`}>{eventContext.event.kind === 'interview' ? <Video size={18} /> : <ListTodo size={18} />}</span>
          <div><small>{eventContext.event.kind === 'interview' ? 'PHỎNG VẤN' : eventContext.event.kind === 'personal' ? 'VIỆC CÁ NHÂN' : 'CÔNG VIỆC'}</small><h3>{eventContext.event.title}</h3></div>
          <button className="icon-button" onClick={() => setEventContext(null)} aria-label="Đóng"><X size={18} /></button>
        </div>
        <div className="calendar-context-details">
          <p><Clock3 size={17} /><span><small>Thời gian</small><strong>{formatDateTime(eventContext.event.startsAt)}{eventContext.event.endsAt ? ` – ${formatTime(eventContext.event.endsAt)}` : ''}</strong></span></p>
          {eventContext.event.application && <>
            <p><BriefcaseBusiness size={17} /><span><small>Ứng tuyển</small><strong>{eventContext.event.application.jobTitle}</strong><em>{eventContext.event.application.companyName}</em></span></p>
            <p><Sparkles size={17} /><span><small>Trạng thái</small><StatusBadge status={eventContext.event.application.status} /></span></p>
          </>}
          {eventContext.event.note && <p><NotebookPen size={17} /><span><small>Ghi chú</small><em>{eventContext.event.note}</em></span></p>}
        </div>
        {eventContext.event.personal ? <div className="calendar-context-buttons">
          <button className="secondary" onClick={() => { setEditingTask(eventContext.event.personal!); setEventContext(null) }}><Pencil size={16} /> Sửa</button>
          <button className="secondary danger-hover" onClick={() => { setDeletingTask(eventContext.event.personal!); setEventContext(null) }}><Trash2 size={16} /> Xóa</button>
        </div> : eventContext.event.application && <button className="primary calendar-context-action" onClick={() => { const applicationId = eventContext.event.application!.id; setEventContext(null); navigate(`/applications/${applicationId}`) }}>Mở trang chi tiết <ArrowRight size={17} /></button>}
      </div>
    </>}
    {createDate && <CalendarTaskModal initialDate={createDate} initialEndDate={createEndDate ?? new Date(createDate.getTime() + 45 * 60000)} onClose={() => { setCreateDate(null); setCreateEndDate(null) }} onSave={values => {
      void personalTasks.save({ id: uid(), ...values, updatedAt: new Date().toISOString() }, 'Đã thêm công việc vào lịch')
      setCreateDate(null)
      setCreateEndDate(null)
    }} />}
    {editingTask && <CalendarTaskModal editing={editingTask} initialDate={new Date(editingTask.startsAt)} initialEndDate={new Date(editingTask.endsAt)} onClose={() => setEditingTask(null)} onSave={values => {
      void personalTasks.save({ ...editingTask, ...values, updatedAt: new Date().toISOString() }, 'Đã cập nhật công việc')
      setEditingTask(null)
    }} />}
    {deletingTask && <Modal title="Xóa công việc?" description={`Công việc “${deletingTask.title}” sẽ bị xóa khỏi lịch.`} onClose={() => setDeletingTask(null)} footer={<><button className="secondary" onClick={() => setDeletingTask(null)}>Giữ lại</button><button className="danger-button" onClick={() => { void personalTasks.remove(deletingTask.id); setDeletingTask(null) }}><Trash2 size={17} /> Xóa công việc</button></>}><div className="confirm-warning"><AlertCircle size={22} /><p>Thao tác này không thể hoàn tác.</p></div></Modal>}
  </div>
}
