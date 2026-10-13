'use client'

import { CalendarDays, ListTodo } from 'lucide-react'
import { formatDueLabel } from '../../utils/date'
import { ApplicationNextAction } from '../../utils/nextAction'

/** The next interview or task as a due chip (red only when overdue) and its title. Shared by the list and the board. */
export function NextActionSummary({ next, now }: { next: ApplicationNextAction; now: Date }) {
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
