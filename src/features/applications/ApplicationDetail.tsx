'use client'

import { useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronDown, Clock3, ExternalLink, FileText, Link2, Mail, MapPin, Pencil, Plus, Sparkles, Trash2, UserRound } from 'lucide-react'
import { Application, Interview, JobTask, Note, Status } from '../../types'
import type { ToastFn } from '../../context/AppDataContext'
import { formatDate } from '../../utils/date'
import { uid } from '../../utils/id'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Interviews } from './Interviews'
import { Tasks } from './Tasks'
import { Timeline } from './Timeline'
import { InterviewModal } from './modals/InterviewModal'
import { NoteModal } from './modals/NoteModal'
import { StatusModal } from './modals/StatusModal'
import { TaskModal } from './modals/TaskModal'

export function ApplicationDetail({ application, update, onChangeStatus, onDelete, navigate, toast }: { application: Application; update: (fn: (a: Application) => Application) => void; onChangeStatus: (status: Status, appliedAt?: string) => void; onDelete: () => void; navigate: (s: string) => void; toast: ToastFn }) {
  const [tab, setTab] = useState<'timeline' | 'interviews' | 'tasks'>('timeline')
  const [modal, setModal] = useState<'status' | 'note' | 'interview' | 'task' | 'delete' | null>(null)
  const info = [
    { icon: MapPin, label: 'Địa điểm', value: application.location || 'Chưa cập nhật' },
    { icon: CalendarDays, label: 'Ngày ứng tuyển', value: formatDate(application.appliedAt) },
    { icon: Clock3, label: 'Hạn nộp', value: formatDate(application.deadlineAt) },
    { icon: Link2, label: 'Nguồn', value: application.source || 'Chưa cập nhật' },
  ]

  // applyStatusChange via useStatusChange: appends STATUS_CHANGED and shows the 'Hoàn tác' toast.
  const changeStatus = (status: Status, appliedAt?: string) => { setModal(null); onChangeStatus(status, appliedAt) }
  const addNote = (content: string) => {
    const now = new Date().toISOString(); const note: Note = { id: uid(), content, createdAt: now, updatedAt: now }
    update(a => ({ ...a, updatedAt: now, appNotes: [note, ...a.appNotes], activities: [{ id: uid(), type: 'NOTE_ADDED', createdAt: now, label: 'Đã thêm ghi chú', detail: content }, ...a.activities] }))
    setModal(null); toast('Đã thêm ghi chú')
  }
  const addInterview = (interview: Interview) => {
    const now = new Date().toISOString()
    update(a => ({ ...a, updatedAt: now, interviews: [interview, ...a.interviews], activities: [{ id: uid(), type: 'INTERVIEW_CREATED', createdAt: now, label: 'Đã lên lịch phỏng vấn', detail: interview.title }, ...a.activities] }))
    setModal(null); setTab('interviews'); toast('Đã tạo lịch phỏng vấn')
  }
  const addTask = (task: JobTask) => { update(a => ({ ...a, updatedAt: new Date().toISOString(), tasks: [task, ...a.tasks] })); setModal(null); setTab('tasks'); toast('Đã thêm việc cần làm') }

  return <div className="page detail-page">
    <button className="back-button" onClick={() => navigate('/applications')}><ArrowLeft size={17} /> Tất cả đơn ứng tuyển</button>
    <div className="detail-hero">
      <div><div className="eyebrow">{application.companyName}</div><h1>{application.jobTitle}</h1><div className="hero-meta"><StatusBadge status={application.status} /></div></div>
      <div className="detail-actions"><button className="secondary" onClick={() => navigate(`/applications/${application.id}/edit`)}><Pencil size={17} /> Chỉnh sửa</button><button className="primary" onClick={() => setModal('status')}>Đổi trạng thái <ChevronDown size={16} /></button><button className="icon-button danger-hover" onClick={() => setModal('delete')} aria-label="Xóa đơn"><Trash2 size={18} /></button></div>
    </div>
    <div className="detail-layout">
      <div className="detail-main">
        <section className="panel info-panel">
          <div className="info-grid">{info.map(item => <div className="info-item" key={item.label}><span><item.icon size={17} /></span><div><small>{item.label}</small><strong>{item.value}</strong></div></div>)}</div>
          {application.jobUrl && <a className="job-link" href={application.jobUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Mở tin tuyển dụng gốc</a>}
          {application.description && <div className="description"><h3>Mô tả công việc</h3><p>{application.description}</p></div>}
          {application.cvContent && <div className="description cv-content"><h3><FileText size={17} /> Nội dung CV đã sử dụng</h3><p>{application.cvContent}</p></div>}
        </section>
        <section className="panel activity-panel">
          <div className="tabs" role="tablist">
            <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Dòng thời gian <span>{application.activities.length}</span></button>
            <button className={tab === 'interviews' ? 'active' : ''} onClick={() => setTab('interviews')}>Phỏng vấn <span>{application.interviews.length}</span></button>
            <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>Việc cần làm <span>{application.tasks.filter(t => !t.completedAt).length}</span></button>
          </div>
          {tab === 'timeline' && <Timeline application={application} addNote={() => setModal('note')} update={update} />}
          {tab === 'interviews' && <Interviews application={application} onAdd={() => setModal('interview')} update={update} toast={toast} />}
          {tab === 'tasks' && <Tasks application={application} onAdd={() => setModal('task')} update={update} toast={toast} />}
        </section>
      </div>
      <aside className="detail-aside">
        <section className="panel next-step">
          <span className="aside-icon"><Sparkles size={20} /></span><h3>Bước tiếp theo</h3>
          <button className="secondary full" onClick={() => setModal('task')}><Plus size={16} />{application.status === 'INTERVIEW' ? 'Thêm việc chuẩn bị' : 'Thêm việc cần làm'}</button>
        </section>
        <section className="panel contact-card"><h3>Liên hệ</h3>{application.contactName || application.contactEmail ? <><div className="contact-person"><span><UserRound size={19} /></span><div><strong>{application.contactName || 'Nhà tuyển dụng'}</strong></div></div>{application.contactEmail && <a href={`mailto:${application.contactEmail}`}><Mail size={15} />{application.contactEmail}</a>}</> : <p>Chưa có thông tin người liên hệ.</p>}</section>
        {application.notes && <section className="panel quick-note"><h3>Ghi chú nhanh</h3><p>{application.notes}</p></section>}
      </aside>
    </div>
    {modal === 'status' && <StatusModal application={application} onClose={() => setModal(null)} onSave={changeStatus} />}
    {modal === 'note' && <NoteModal onClose={() => setModal(null)} onSave={addNote} />}
    {modal === 'interview' && <InterviewModal onClose={() => setModal(null)} onSave={addInterview} />}
    {modal === 'task' && <TaskModal onClose={() => setModal(null)} onSave={addTask} />}
    {modal === 'delete' && <ConfirmModal title="Xóa đơn ứng tuyển?" description={`Đơn “${application.jobTitle}” tại ${application.companyName} sẽ không còn xuất hiện trong danh sách và dashboard.`} onClose={() => setModal(null)} onConfirm={onDelete} />}
  </div>
}
