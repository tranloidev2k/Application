'use client'

import { CalendarDays, ListTodo, Plus } from 'lucide-react'
import { Application } from '../../../types'
import { formatDueLabel } from '../../../utils/date'
import { getNextAction } from '../../../utils/nextAction'

/** 'Việc tiếp theo': a chip with when it is due (red only when overdue) and its title, or a quiet way to add one. */
export function NextActionCell({ app, now, onAdd }: { app: Application; now: Date; onAdd: (app: Application) => void }) {
  const next = getNextAction(app, now)
  if (!next) return <button type="button" className="add-next" onClick={() => onAdd(app)} aria-label={`Thêm bước tiếp theo cho đơn ${app.jobTitle}`}>
    <Plus size={14} aria-hidden="true" /><span className="add-next-label">Thêm bước tiếp theo</span>
  </button>

  const Icon = next.kind === 'interview' ? CalendarDays : ListTodo
  return <div className="next-action">
    <span className={`next-chip ${next.kind} ${next.overdue ? 'overdue' : ''}`}>
      <Icon size={14} aria-hidden="true" />
      <span className="sr-only">{next.kind === 'interview' ? 'Phỏng vấn: ' : 'Việc cần làm: '}</span>
      {next.at ? formatDueLabel(next.at, now) : 'Chưa có hạn'}
    </span>
    <span className="next-title" title={next.title}>{next.title}</span>
  </div>
}
