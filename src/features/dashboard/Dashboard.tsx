'use client'

import { CalendarDays, CheckCircle2, ChevronRight, Plus } from 'lucide-react'
import { Application } from '../../types'
import { calendarDateKey, formatDate, formatDateTime, formatTime } from '../../utils/date'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyMini } from '../../components/ui/EmptyMini'
import { Metric } from './Metric'
import { PanelHeader } from './PanelHeader'
import { StatusChart } from './StatusChart'

export function Dashboard({ applications, navigate }: { applications: Application[]; navigate: (s: string) => void }) {
  const apps = applications.filter(a => !a.deletedAt)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 864e5)
  const interviews = apps.flatMap(a => a.interviews.filter(i => !i.cancelledAt && new Date(i.startsAt) >= now && new Date(i.startsAt) <= nextWeek).map(i => ({ ...i, app: a }))).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const tasks = apps.flatMap(a => a.tasks.filter(t => !t.completedAt && t.dueAt && new Date(t.dueAt) <= nextWeek).map(t => ({ ...t, app: a }))).sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || ''))
  return <div className="page dashboard-page">
    <PageHeader title="Tổng quan" action={<button className="primary" onClick={() => navigate('/applications/new')}><Plus size={18} /> Thêm đơn ứng tuyển</button>} />
    <section className="dashboard-overview" aria-label="Tổng quan ứng tuyển">
      <StatusChart applications={apps} navigate={navigate} />
      <div className="priority-metrics">
        <Metric label="Cần xử lý" value={tasks.length} onClick={() => navigate(`/calendar?view=week&date=${calendarDateKey(now)}`)} />
        <Metric label="Phỏng vấn" value={apps.filter(a => a.status === 'INTERVIEW').length} onClick={() => navigate('/applications?status=INTERVIEW')} />
      </div>
    </section>
    <div className="dashboard-grid">
      <section className="panel schedule-panel">
        <PanelHeader title="Lịch sắp tới" action="Xem tất cả" onAction={() => navigate('/applications?status=INTERVIEW')} />
        {interviews.length ? interviews.map(item => <button key={item.id} className="schedule-item" onClick={() => navigate(`/applications/${item.app.id}`)}>
          <span className="schedule-date"><CalendarDays size={18} /><strong>{formatDate(item.startsAt)}</strong></span>
          <span className="schedule-copy"><strong>{item.title}</strong><small>{item.app.companyName}</small></span>
          <time>{formatTime(item.startsAt)} – {formatTime(item.endsAt)}</time>
          <ChevronRight size={19} />
        </button>) : <EmptyMini icon={<CalendarDays />} text="Chưa có lịch phỏng vấn trong 7 ngày tới." />}
      </section>
      <section className="panel task-panel">
        <PanelHeader title="Việc cần làm" action="Đến danh sách" onAction={() => navigate('/applications')} />
        {tasks.length ? tasks.map(item => {
          const overdue = new Date(item.dueAt!) < now
          return <button key={item.id} className="task-row" onClick={() => navigate(`/applications/${item.app.id}`)}>
            <span className={`task-check ${overdue ? 'overdue' : ''}`} />
            <span><strong>{item.title}</strong><small>{item.app.companyName}</small></span>
            <em className={overdue ? 'danger-text' : ''}>{overdue ? 'Quá hạn' : formatDateTime(item.dueAt)}</em>
          </button>
        }) : <EmptyMini icon={<CheckCircle2 />} text="Tuyệt! Không có việc nào sắp đến hạn." />}
      </section>
    </div>
  </div>
}
