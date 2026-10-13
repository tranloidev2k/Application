'use client'

import { BriefcaseBusiness, CalendarClock, ListTodo, Activity } from 'lucide-react'
import { formatRelativeDay, formatTime } from '../../utils/date'
import { ACTIVE_FILTER_HREF, DashboardData } from './dashboardData'
import { KpiTile } from './KpiTile'

/** The four spec F07 metrics. No conversion or response rate: F07 keeps those out of the MVP. */
export function KpiGrid({ data, now }: { data: DashboardData; now: Date }) {
  const saved = data.statusCounts.SAVED
  const nextInterview = data.interviews[0]
  return <section className="kpi-grid" aria-label="Số liệu chính">
    <KpiTile icon={BriefcaseBusiness} label="Tổng đơn" value={data.apps.length} href="/applications" />
    <KpiTile icon={Activity} label="Đang hoạt động" value={data.activeCount} href={ACTIVE_FILTER_HREF} hint={saved ? `${saved} đơn đã lưu` : undefined} />
    <KpiTile
      icon={CalendarClock}
      label="Phỏng vấn 7 ngày tới"
      value={data.interviews.length}
      href={data.calendarHref}
      hint={nextInterview ? `${formatRelativeDay(nextInterview.startsAt, now)} ${formatTime(nextInterview.startsAt)}` : undefined}
    />
    <KpiTile
      icon={ListTodo}
      label="Việc đến hạn"
      value={data.dueTasks.length}
      href={data.calendarHref}
      hint={data.overdueCount ? `${data.overdueCount} quá hạn` : undefined}
      hintTone="danger"
    />
  </section>
}
