'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { calendarDateKey } from '../../utils/date'
import type { TaskItem } from './dashboardData'

/** One open task: a completion button and, as its sibling (never nested), a link to the application or calendar day. */
export function TaskRow({ item, onComplete }: { item: TaskItem; onComplete: (item: TaskItem) => void }) {
  const href = item.kind === 'job' ? `/applications/${item.app.id}` : `/calendar?view=week&date=${calendarDateKey(item.dueAt)}`
  return <li className={`task-row ${item.overdue ? 'overdue' : ''}`}>
    <button type="button" className="task-check" onClick={() => onComplete(item)} aria-label={`Đánh dấu hoàn thành: ${item.title}`} title="Đánh dấu hoàn thành">
      <span className="task-check-circle"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>
    </button>
    <Link className="task-row-link" href={href}>
      <span className="task-row-copy">
        <strong>{item.title}</strong>
        {item.kind === 'job' ? <small>{item.app.companyName}</small> : <small><span className="task-tag">Cá nhân</span></small>}
      </span>
      <em className={item.overdue ? 'danger-text' : undefined}>{item.label}</em>
    </Link>
  </li>
}
