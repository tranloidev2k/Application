'use client'

import Link from 'next/link'
import { CalendarDays, ChevronRight, Plus } from 'lucide-react'
import { formatRelativeDay, formatTime } from '../../utils/date'
import { EmptyMini } from '../../components/ui/EmptyMini'
import { ACTIVE_FILTER_HREF, InterviewItem } from './dashboardData'
import { PanelHeader } from './PanelHeader'

/** 'Lịch sắp tới': interviews in the next 7 days, with a ghost row to add one while the list is short. */
export function SchedulePanel({ interviews, now, calendarHref }: { interviews: InterviewItem[]; now: Date; calendarHref: string }) {
  return <section className="panel schedule-panel" aria-labelledby="schedule-title">
    <PanelHeader id="schedule-title" title="Lịch sắp tới" action="Xem tất cả" href={calendarHref} />
    {interviews.length
      ? <ul className="panel-list">
        {interviews.map(item => <li key={item.id}>
          <Link className="schedule-item" href={`/applications/${item.app.id}`}>
            <span className="schedule-when">
              <strong>{formatRelativeDay(item.startsAt, now)}</strong>
              <time dateTime={item.startsAt}>{formatTime(item.startsAt)} – {formatTime(item.endsAt)}</time>
            </span>
            <span className="schedule-copy"><strong>{item.title}</strong><small>{item.app.companyName} · {item.app.jobTitle}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </li>)}
      </ul>
      : <EmptyMini icon={<CalendarDays />} text="Chưa có lịch phỏng vấn trong 7 ngày tới." />}
    {interviews.length < 3 && <Link className="ghost-row" href={ACTIVE_FILTER_HREF}><Plus size={16} aria-hidden="true" /> Thêm lịch phỏng vấn</Link>}
  </section>
}
