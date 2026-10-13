'use client'

import { Check, ListTodo, Plus, Trash2 } from 'lucide-react'
import { JobTask } from '../../../types'
import { formatDateTime } from '../../../utils/date'
import { EmptyTab } from '../../../components/ui/EmptyTab'

export function Tasks({ tasks, now, onAdd, onToggle, onDelete }: { tasks: JobTask[]; now: Date | null; onAdd: () => void; onToggle: (task: JobTask) => void; onDelete: (task: JobTask) => void }) {
  return <div className="tab-content">
    <div className="tab-toolbar"><h3>Việc cần làm</h3><button type="button" className="secondary compact" onClick={onAdd}><Plus size={17} /> Thêm việc</button></div>
    {tasks.length ? <ul className="detail-task-list">{tasks.map(task => {
      const overdue = Boolean(now && task.dueAt && !task.completedAt && new Date(task.dueAt).getTime() < now.getTime())
      return <li className={`detail-task ${task.completedAt ? 'done' : ''}`} key={task.id}>
        <button type="button" className="round-check" onClick={() => onToggle(task)} aria-label={task.completedAt ? `Mở lại: ${task.title}` : `Hoàn thành: ${task.title}`}>{task.completedAt && <Check size={15} />}</button>
        <div className="detail-task-copy">
          <strong>{task.title}</strong>
          {task.note && <p>{task.note}</p>}
          <small className={overdue ? 'danger-text' : ''}>{task.dueAt ? `${overdue ? 'Quá hạn · ' : ''}${formatDateTime(task.dueAt)}` : 'Không có hạn'}</small>
        </div>
        <button type="button" className="icon-button danger-hover" onClick={() => onDelete(task)} aria-label={`Xóa việc ${task.title}`} title="Xóa việc"><Trash2 size={16} /></button>
      </li>
    })}</ul> : <EmptyTab icon={<ListTodo />} title="Chưa có việc cần làm" text="Thêm một hành động nhỏ để giữ đà tiến lên." action="Thêm việc đầu tiên" onAction={onAdd} />}
  </div>
}
