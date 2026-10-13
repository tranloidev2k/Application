'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { EmptyMini } from '../../components/ui/EmptyMini'
import type { TaskGroup, TaskItem } from './dashboardData'
import { PanelHeader } from './PanelHeader'
import { TaskRow } from './TaskRow'

type TasksPanelProps = { groups: TaskGroup[]; undatedCount: number; hasApplications: boolean; calendarHref: string; onComplete: (item: TaskItem) => void }

/** 'Việc cần làm': open tasks due within 7 days grouped Quá hạn / Hôm nay / Tuần này. Undated tasks stay out of the list (spec F06). */
export function TasksPanel({ groups, undatedCount, hasApplications, calendarHref, onComplete }: TasksPanelProps) {
  return <section className="panel task-panel" aria-labelledby="tasks-title">
    <PanelHeader id="tasks-title" title="Việc cần làm" action="Mở lịch" href={calendarHref} />
    {groups.length
      ? groups.map(group => <div key={group.key} className={`task-group ${group.key}`}>
        <h3 className="task-group-title" id={`task-group-${group.key}`}>{group.label}<span className="count-pill">{group.items.length}</span></h3>
        <ul className="panel-list" aria-labelledby={`task-group-${group.key}`}>
          {group.items.map(item => <TaskRow key={`${item.kind}-${item.id}`} item={item} onComplete={onComplete} />)}
        </ul>
      </div>)
      : <EmptyMini icon={<CheckCircle2 />} text={hasApplications ? 'Không có việc nào đến hạn trong 7 ngày tới.' : 'Việc cần làm của từng đơn sẽ hiện ở đây.'} />}
    {undatedCount > 0 && <Link className="ghost-row" href="/applications">+{undatedCount} việc chưa đặt hạn<ArrowRight size={15} aria-hidden="true" /></Link>}
  </section>
}
