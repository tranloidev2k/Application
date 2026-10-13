'use client'

import Link from 'next/link'
import { MouseEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Application, Status } from '../../../types'
import { Monogram } from '../../../components/ui/Monogram'
import { StatusMenu } from '../../../components/ui/StatusMenu'
import { isInteractiveTarget } from '../../../utils/interactive'
import { NextActionCell } from './NextActionCell'
import { TimelineCell } from './TimelineCell'

/** The DOM id of a row's title link, so focus can land there after the row's own controls change. */
export const applicationLinkId = (id: string) => `application-link-${id}`

export type RowHandlers = {
  navigate: (to: string) => void
  onStatusSelect: (app: Application, status: Status) => void
  onAddNext: (app: Application) => void
  onDelete: (app: Application) => void
}

/**
 * One table row. The title is the real link (keyboard and screen readers); clicking elsewhere on the row is a
 * mouse-only shortcut to the same page that ignores clicks on controls, menus, dialogs and text selection.
 */
export function ApplicationRow({ app, now, navigate, onStatusSelect, onAddNext, onDelete }: { app: Application; now: Date } & RowHandlers) {
  const href = `/applications/${app.id}`
  const onRowClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) return
    if (window.getSelection()?.toString()) return
    navigate(href)
  }

  return <div className="table-row" role="row" onClick={onRowClick}>
    <div className="job-cell" role="cell">
      <Monogram name={app.companyName} />
      <div className="job-copy">
        <Link id={applicationLinkId(app.id)} className="job-title" href={href}>{app.jobTitle}</Link>
        <span className="job-meta">{[app.companyName, app.location].filter(Boolean).join(' · ')}</span>
      </div>
    </div>
    <div className="status-cell" role="cell">
      <StatusMenu status={app.status} contextLabel={app.jobTitle} onSelect={status => onStatusSelect(app, status)} />
    </div>
    <div className="next-cell" role="cell"><NextActionCell app={app} now={now} onAdd={onAddNext} /></div>
    <div className="timeline-cell" role="cell"><TimelineCell app={app} now={now} /></div>
    <div className="row-actions" role="cell">
      <Link className="icon-button" href={`${href}/edit`} aria-label={`Sửa đơn ${app.jobTitle}`} title="Sửa"><Pencil size={16} aria-hidden="true" /></Link>
      <button type="button" className="icon-button delete" onClick={() => onDelete(app)} aria-label={`Xóa đơn ${app.jobTitle}`} title="Xóa"><Trash2 size={16} aria-hidden="true" /></button>
    </div>
  </div>
}
