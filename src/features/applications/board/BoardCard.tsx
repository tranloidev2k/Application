'use client'

import Link from 'next/link'
import { DragEvent, MouseEvent, useRef } from 'react'
import { Application, Status } from '../../../types'
import { Monogram } from '../../../components/ui/Monogram'
import { StatusMenu } from '../../../components/ui/StatusMenu'
import { formatAgo } from '../../../utils/date'
import { isInteractiveTarget } from '../../../utils/interactive'
import { getNextAction } from '../../../utils/nextAction'
import { NextActionSummary } from '../NextActionSummary'
import { DeadlineChip } from './DeadlineChip'

/** The DOM id of a board card's title link, so focus can follow a card that moved to another column. */
export const boardCardLinkId = (id: string) => `board-card-${id}`

export type BoardCardHandlers = {
  navigate: (to: string) => void
  onDragStart: (app: Application) => void
  onDragEnd: () => void
  /** The status menu: the keyboard and touch way to move a card. */
  onMenuMove: (app: Application, status: Status) => void
}

/**
 * One application on the board. The <article> is the drag source (a native <button> face would block HTML5 drag in
 * Firefox); the title is the real link, with draggable={false} so a drag that starts on it still moves the card.
 * A click on the card body opens the detail page, except right after a drag or on a control.
 */
export function BoardCard({ app, now, dragging, navigate, onDragStart, onDragEnd, onMenuMove }: { app: Application; now: Date; dragging: boolean } & BoardCardHandlers) {
  const didDragRef = useRef(false)
  const href = `/applications/${app.id}`
  const linkId = boardCardLinkId(app.id)
  const next = getNextAction(app, now)

  const onCardDragStart = (event: DragEvent<HTMLElement>) => {
    didDragRef.current = true
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', app.id)
    onDragStart(app)
  }
  const onCardDragEnd = () => {
    // Cleared a tick later, so a click that some browsers fire at the end of a drag is still ignored.
    window.setTimeout(() => { didDragRef.current = false }, 0)
    onDragEnd()
  }
  const onCardClick = (event: MouseEvent<HTMLElement>) => {
    if (didDragRef.current || isInteractiveTarget(event.target) || window.getSelection()?.toString()) return
    navigate(href)
  }

  return <article
    className={`board-card ${dragging ? 'dragging' : ''}`}
    draggable
    aria-labelledby={linkId}
    onDragStart={onCardDragStart}
    onDragEnd={onCardDragEnd}
    onClick={onCardClick}
  >
    <div className="board-card-head">
      <Link id={linkId} className="board-card-title" href={href} draggable={false}>{app.jobTitle}</Link>
      <StatusMenu variant="icon" status={app.status} contextLabel={app.jobTitle} onSelect={status => onMenuMove(app, status)} />
    </div>
    <div className="board-card-company">
      <Monogram name={app.companyName} />
      <span>{[app.companyName, app.location].filter(Boolean).join(' · ')}</span>
    </div>
    {next && <NextActionSummary next={next} now={now} />}
    {app.status === 'SAVED' && app.deadlineAt && <DeadlineChip deadline={app.deadlineAt} now={now} />}
    <span className="board-card-updated">Cập nhật {formatAgo(app.updatedAt, now)}</span>
  </article>
}
