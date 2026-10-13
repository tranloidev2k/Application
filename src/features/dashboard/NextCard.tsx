'use client'

import Link from 'next/link'
import { AlarmClock, CalendarClock, ExternalLink, Hourglass, ListTodo, LucideIcon, Mail } from 'lucide-react'
import type { NextAction, NextActionKind } from './dashboardData'

const ICONS: Record<NextActionKind, LucideIcon> = { overdue: AlarmClock, task: ListTodo, interview: CalendarClock, deadline: Hourglass, followup: Mail }

/** A neutral card with a tone-coloured icon. The title link covers the whole card; the optional action sits above it. */
export function NextCard({ action }: { action: NextAction }) {
  const Icon = ICONS[action.kind]
  const extra = action.action
  return <article className={`next-card tone-${action.kind}`}>
    <span className="next-card-icon" aria-hidden="true"><Icon size={18} /></span>
    <div className="next-card-body">
      <p className="next-card-eyebrow">{action.eyebrow}</p>
      <h3><Link className="next-card-link" href={action.href}>{action.title}</Link></h3>
      <p className="next-card-meta">{action.meta}</p>
      {extra && (extra.external
        ? <a className="next-card-action" href={extra.href} target="_blank" rel="noopener noreferrer">{extra.label}<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (mở thẻ mới)</span></a>
        : <a className="next-card-action" href={extra.href}>{extra.label}</a>)}
    </div>
  </article>
}
