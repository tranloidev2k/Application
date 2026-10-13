'use client'

import { DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Application, Status, STATUSES } from '../../../types'
import { useScrollEdges } from '../../../hooks/useScrollEdges'
import type { PendingStatusChange } from '../useStatusChange'
import { boardCardLinkId, BoardCardHandlers } from './BoardCard'
import { BoardColumn, boardRailToggleId, ColumnDropHandlers } from './BoardColumn'

/** Full columns, in pipeline order. */
const OPEN_COLUMNS: Status[] = ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']
/** Closed outcomes: collapsed rails that open on click or while a drag hovers them. */
const RAIL_COLUMNS: Status[] = ['REJECTED', 'WITHDRAWN']

function groupByStatus(items: Application[]) {
  const groups = Object.fromEntries(STATUSES.map(status => [status, [] as Application[]])) as Record<Status, Application[]>
  items.forEach(app => groups[app.status].push(app))
  return groups
}

/** dragleave also fires when moving between a column's own children; only a pointer that left its box counts. */
function leftElement(event: DragEvent<HTMLElement>) {
  const related = event.relatedTarget
  if (related instanceof Node) return !event.currentTarget.contains(related)
  const rect = event.currentTarget.getBoundingClientRect()
  return event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY >= rect.bottom
}

/**
 * The applications grouped into status columns. Cards move by drag and drop or by each card's status menu; both go
 * through `onMove` (useStatusChange), so the applied-date rule, the history entry and the undo toast are the same as
 * everywhere else. A drop on the card's own column does nothing. Cards keep the order of `items` (the current sort).
 */
export function ApplicationBoard({ items, now, navigate, onMove, pending }: {
  items: Application[]
  now: Date
  navigate: (to: string) => void
  onMove: (app: Application, status: Status) => void
  pending: PendingStatusChange | null
}) {
  const groups = useMemo(() => groupByStatus(items), [items])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<Status | null>(null)
  const [openRails, setOpenRails] = useState<Status[]>([])
  const [boardRef, overflow] = useScrollEdges<HTMLDivElement>()
  // The dragged card, set synchronously in dragstart for the drag handlers; `draggingId` only drives the styling.
  const dragRef = useRef<Application | null>(null)
  const dragTimerRef = useRef(0)
  // A card moved from its status menu is re-mounted in another column; focus follows it there (or to the collapsed
  // rail it went into).
  const focusAfterMoveRef = useRef<PendingStatusChange | null>(null)

  useEffect(() => {
    const target = focusAfterMoveRef.current
    if (!target) return
    if (items.find(app => app.id === target.applicationId)?.status !== target.status) return
    focusAfterMoveRef.current = null
    const landed = document.getElementById(boardCardLinkId(target.applicationId)) ?? document.getElementById(boardRailToggleId(target.status))
    landed?.focus()
  }, [items])

  // While a card is dragged, a drop outside the columns (e.g. on the search box) must not insert its id as text.
  useEffect(() => {
    if (!draggingId) return
    const guard = (event: globalThis.DragEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.board-column')) event.preventDefault()
    }
    document.addEventListener('drop', guard, true)
    return () => document.removeEventListener('drop', guard, true)
  }, [draggingId])

  useEffect(() => () => window.clearTimeout(dragTimerRef.current), [])

  const endDrag = () => {
    window.clearTimeout(dragTimerRef.current)
    dragRef.current = null
    setDraggingId(null)
    setDropTarget(null)
  }

  const cards: BoardCardHandlers = {
    navigate,
    onDragStart: app => {
      dragRef.current = app
      focusAfterMoveRef.current = null
      // Styled a tick later, so the browser's drag image is taken from the card before it fades.
      window.clearTimeout(dragTimerRef.current)
      dragTimerRef.current = window.setTimeout(() => setDraggingId(app.id), 0)
    },
    onDragEnd: endDrag,
    onMenuMove: (app, status) => {
      focusAfterMoveRef.current = { applicationId: app.id, status }
      onMove(app, status)
    },
  }

  const dropHandlers = (status: Status): ColumnDropHandlers => ({
    onDragOver: event => {
      const app = dragRef.current
      if (!app || app.status === status) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setDropTarget(status)
    },
    onDragLeave: event => {
      if (leftElement(event)) setDropTarget(current => current === status ? null : current)
    },
    onDrop: event => {
      event.preventDefault()
      const dragged = dragRef.current
      // The source card may be re-mounted in its new column before dragend reaches it, so clean up here too.
      endDrag()
      // The latest copy, in case a sync changed the application during the drag.
      const app = dragged && (items.find(item => item.id === dragged.id) ?? dragged)
      if (app && app.status !== status) onMove(app, status)
    },
  })

  const column = (status: Status, rail?: boolean) => <BoardColumn
    key={status}
    status={status}
    apps={groups[status]}
    now={now}
    dropTarget={dropTarget === status}
    draggingId={draggingId}
    ghostTitle={pending?.status === status ? items.find(app => app.id === pending.applicationId)?.jobTitle : undefined}
    rail={rail ? {
      expanded: openRails.includes(status) || dropTarget === status,
      pinned: openRails.includes(status),
      onToggle: () => setOpenRails(current => current.includes(status) ? current.filter(item => item !== status) : [...current, status]),
    } : undefined}
    drop={dropHandlers(status)}
    cards={cards}
  />

  return <section className="panel board-panel" aria-label="Bảng trạng thái">
    <div className="board-layout">
      <div className={`board-viewport ${overflow.start ? 'overflow-start' : ''} ${overflow.end ? 'overflow-end' : ''}`}>
        <div ref={boardRef} className="board">{OPEN_COLUMNS.map(status => column(status))}</div>
      </div>
      <div className="board-rails">{RAIL_COLUMNS.map(status => column(status, true))}</div>
    </div>
  </section>
}
