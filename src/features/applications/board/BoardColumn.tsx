'use client'

import { DragEvent, useRef } from 'react'
import { ChevronsRight } from 'lucide-react'
import { Application, Status, STATUS_META } from '../../../types'
import { BoardCard, BoardCardHandlers } from './BoardCard'

export type ColumnDropHandlers = {
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragLeave: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
}

/** The DOM id of a collapsed rail's toggle, so focus can land there when a card moves into the hidden column. */
export const boardRailToggleId = (status: Status) => `board-rail-${status}`

/** A closed-status rail: collapsed to a narrow strip, open while `expanded` (clicked open, or hovered by a drag). */
export type RailState = { expanded: boolean; pinned: boolean; onToggle: () => void }

/**
 * One status column: a header (dot, label, count) and a vertically scrolling list of cards, or a collapsed rail with
 * a vertical label. The outer element stays the same when a rail opens, so a drag hovering it is not interrupted.
 */
export function BoardColumn({ status, apps, now, dropTarget, draggingId, ghostTitle, rail, drop, cards }: {
  status: Status
  apps: Application[]
  now: Date
  dropTarget: boolean
  draggingId: string | null
  /** The title of a card waiting on the applied-date dialog to land here. */
  ghostTitle?: string
  rail?: RailState
  drop: ColumnDropHandlers
  cards: BoardCardHandlers
}) {
  const columnRef = useRef<HTMLDivElement>(null)
  const { label, tone } = STATUS_META[status]
  const count = apps.length
  const collapsed = rail && !rail.expanded
  const className = ['board-column', rail && 'board-rail', rail?.expanded && 'expanded', dropTarget && 'drop-target'].filter(Boolean).join(' ')

  // The button that was pressed is replaced by its counterpart (expand ↔ collapse), so focus moves to the new one.
  const toggleRail = () => {
    rail?.onToggle()
    window.requestAnimationFrame(() => columnRef.current?.querySelector<HTMLElement>('.board-rail-toggle, .board-rail-collapse')?.focus())
  }

  return <div ref={columnRef} className={className} {...drop}>
    {collapsed ? <button type="button" id={boardRailToggleId(status)} className="board-rail-toggle" aria-expanded={false} aria-label={`${label}, ${count} đơn. Mở rộng cột`} onClick={toggleRail}>
      <span className={`status-dot ${tone}`} aria-hidden="true" />
      <span className="board-rail-label">{label}</span>
      <span className="count-pill">{count}</span>
    </button> : <>
      <div className="board-column-head">
        <span className={`status-dot ${tone}`} aria-hidden="true" />
        <h2 className="board-column-title">{label}</h2>
        <span className="count-pill" aria-hidden="true">{count}</span>
        {rail?.pinned && <button type="button" className="icon-button board-rail-collapse" aria-expanded={true} aria-label={`Thu gọn cột ${label}`} title="Thu gọn" onClick={toggleRail}>
          <ChevronsRight size={16} aria-hidden="true" />
        </button>}
      </div>
      <div className="board-column-body">
        <ul className="board-list" aria-label={`${label}, ${count} đơn`}>
          {ghostTitle && <li className="board-ghost" aria-hidden="true">{ghostTitle}</li>}
          {apps.map(app => <li key={app.id}><BoardCard app={app} now={now} dragging={app.id === draggingId} {...cards} /></li>)}
        </ul>
        {!count && !ghostTitle && <p className="board-empty">Kéo đơn vào đây</p>}
      </div>
    </>}
  </div>
}
