'use client'

import { Check, ListTodo, Plus, Trash2 } from 'lucide-react'
import { Application, JobTask } from '../../types'
import type { ToastFn } from '../../context/AppDataContext'
import { formatDateTime } from '../../utils/date'
import { uid } from '../../utils/id'
import { completeJobTask } from '../../utils/tasks'
import { EmptyTab } from '../../components/ui/EmptyTab'

export function Tasks({ application, onAdd, update, toast }: { application: Application; onAdd: () => void; update: (fn: (a: Application) => Application) => void; toast: ToastFn }) {
  const toggle = (task: JobTask) => { update(a => task.completedAt ? { ...a, tasks: a.tasks.map(t => t.id === task.id ? { ...t, completedAt: undefined } : t) } : completeJobTask(a, task.id, new Date().toISOString(), uid())); toast(task.completedAt ? 'Đã mở lại công việc' : 'Đã hoàn thành công việc') }
  const remove = (id: string) => update(a => ({ ...a, tasks: a.tasks.filter(t => t.id !== id) }))
  return <div className="tab-content"><div className="tab-toolbar"><h3>Việc cần làm</h3><button className="secondary compact" onClick={onAdd}><Plus size={17} /> Thêm việc</button></div>
    {application.tasks.length ? <div className="detail-task-list">{application.tasks.map(t => <div className={`detail-task ${t.completedAt ? 'done' : ''}`} key={t.id}><button className="round-check" onClick={() => toggle(t)} aria-label={t.completedAt ? 'Mở lại' : 'Hoàn thành'}>{t.completedAt && <Check size={15} />}</button><div><strong>{t.title}</strong>{t.note && <p>{t.note}</p>}<small className={t.dueAt && !t.completedAt && new Date(t.dueAt) < new Date() ? 'danger-text' : ''}>{t.dueAt ? `${new Date(t.dueAt) < new Date() && !t.completedAt ? 'Quá hạn · ' : ''}${formatDateTime(t.dueAt)}` : 'Không có hạn'}</small></div><button className="icon-button danger-hover" onClick={() => remove(t.id)}><Trash2 size={16} /></button></div>)}</div> : <EmptyTab icon={<ListTodo />} title="Chưa có việc cần làm" text="Thêm một hành động nhỏ để giữ đà tiến lên." action="Thêm việc đầu tiên" onAction={onAdd} />}
  </div>
}
