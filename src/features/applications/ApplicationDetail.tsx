'use client'

import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Application, Interview, JobTask, Note, Status } from '../../types'
import type { ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'
import { useNow } from '../../hooks/useNow'
import { uid } from '../../utils/id'
import { applyStatusChange } from '../../utils/status'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { ContactCard } from './detail/ContactCard'
import { DetailHero } from './detail/DetailHero'
import { DetailTab, DetailTabs } from './detail/DetailTabs'
import { ApplicationUpdate, cancelInterviewWithUndo, completeTaskWithUndo, deleteNoteWithUndo, deleteTaskWithUndo } from './detail/detailActions'
import { InfoPanel } from './detail/InfoPanel'
import { Interviews } from './detail/Interviews'
import { NextStepCard } from './detail/NextStepCard'
import { Tasks } from './detail/Tasks'
import { Timeline } from './detail/Timeline'
import { buildTimelineEntries } from './detail/timelineEntries'
import { InterviewModal, InterviewStatusMove } from './modals/InterviewModal'
import { NoteModal } from './modals/NoteModal'
import { StatusModal } from './modals/StatusModal'
import { TaskModal } from './modals/TaskModal'
import { useStatusChange } from './useStatusChange'

type DetailModal = { kind: 'status' | 'note' | 'interview' | 'delete' } | { kind: 'task'; initialTitle?: string } | null

export function ApplicationDetail({ application, updateApplication, onDelete, navigate, toast }: {
  application: Application
  updateApplication: UpdateApplicationFn
  onDelete: () => void
  navigate: (to: string) => void
  toast: ToastFn
}) {
  const { id } = application
  const update = useCallback<ApplicationUpdate>(updater => updateApplication(id, updater), [updateApplication, id])
  // One shared status rule: commits with a 'Hoàn tác' toast, or asks for the applied date first. Its dialog renders at page level.
  const { requestStatusChange, commitStatusChange, statusModal } = useStatusChange(updateApplication, toast)
  const nowMs = useNow()
  const now = useMemo(() => nowMs ? new Date(nowMs) : null, [nowMs])
  const entries = useMemo(() => buildTimelineEntries(application), [application])
  const [tab, setTab] = useState<DetailTab>('timeline')
  const [modal, setModal] = useState<DetailModal>(null)
  const closeModal = () => setModal(null)

  const selectStatus = (status: Status) => requestStatusChange(application, status)
  const saveStatus = (status: Status, appliedAt?: string) => { closeModal(); commitStatusChange(application, status, appliedAt) }

  const addNote = (content: string) => {
    const now = new Date().toISOString()
    const note: Note = { id: uid(), content, createdAt: now, updatedAt: now }
    update(a => ({ ...a, updatedAt: now, appNotes: [note, ...a.appNotes], activities: [{ id: uid(), type: 'NOTE_ADDED', createdAt: now, label: 'Đã thêm ghi chú', detail: content }, ...a.activities] }))
    closeModal(); setTab('timeline'); toast('Đã thêm ghi chú')
  }

  // One updater: the interview, its activity and the optional move to INTERVIEW land in a single pending save.
  const addInterview = (interview: Interview, move: InterviewStatusMove | null) => {
    const now = new Date().toISOString()
    const result = { moved: false }
    update(a => {
      const scheduled: Application = { ...a, updatedAt: now, interviews: [interview, ...a.interviews], activities: [{ id: uid(), type: 'INTERVIEW_CREATED', createdAt: now, label: 'Đã lên lịch phỏng vấn', detail: interview.title }, ...a.activities] }
      if (!move || a.status === 'INTERVIEW') return scheduled
      result.moved = true
      return applyStatusChange(scheduled, 'INTERVIEW', move.appliedAt)
    })
    closeModal(); setTab('interviews')
    toast(result.moved ? 'Đã tạo lịch phỏng vấn và chuyển sang Phỏng vấn' : 'Đã tạo lịch phỏng vấn')
  }

  const addTask = (task: JobTask) => {
    update(a => ({ ...a, updatedAt: new Date().toISOString(), tasks: [task, ...a.tasks] }))
    closeModal(); setTab('tasks'); toast('Đã thêm việc cần làm')
  }

  const toggleTask = (task: JobTask) => {
    if (!task.completedAt) { completeTaskWithUndo(update, toast, task); return }
    update(a => ({ ...a, tasks: a.tasks.map(t => t.id === task.id ? { ...t, completedAt: undefined } : t) }))
    toast('Đã mở lại công việc')
  }

  const openTasks = application.tasks.filter(task => !task.completedAt).length

  return <div className="page detail-page">
    <button type="button" className="back-button" onClick={() => navigate('/applications')}><ArrowLeft size={17} /> Tất cả đơn ứng tuyển</button>
    <DetailHero application={application} onSelectStatus={selectStatus} onOtherStatus={() => setModal({ kind: 'status' })} onDelete={() => setModal({ kind: 'delete' })} />
    <div className="detail-layout">
      <div className="detail-main">
        <InfoPanel application={application} toast={toast} />
        <section className="panel activity-panel">
          <DetailTabs label="Hoạt động của đơn" active={tab} onChange={setTab} tabs={[
            { id: 'timeline', label: 'Dòng thời gian', count: entries.length, panel: <Timeline entries={entries} now={now} onAddNote={() => setModal({ kind: 'note' })} onDeleteNote={noteId => deleteNoteWithUndo(update, toast, noteId)} /> },
            { id: 'interviews', label: 'Phỏng vấn', count: application.interviews.length, panel: <Interviews interviews={application.interviews} onAdd={() => setModal({ kind: 'interview' })} onCancel={interview => cancelInterviewWithUndo(update, toast, interview)} /> },
            { id: 'tasks', label: 'Việc cần làm', count: openTasks, panel: <Tasks tasks={application.tasks} now={now} onAdd={() => setModal({ kind: 'task' })} onToggle={toggleTask} onDelete={task => deleteTaskWithUndo(update, toast, task.id)} /> },
          ]} />
        </section>
      </div>
      <aside className="detail-aside">
        <NextStepCard
          application={application}
          now={now}
          onCompleteTask={task => completeTaskWithUndo(update, toast, task)}
          onMarkApplied={() => selectStatus('APPLIED')}
          onAddTask={initialTitle => setModal({ kind: 'task', initialTitle })}
        />
        <ContactCard application={application} />
        {application.notes && <section className="panel quick-note"><h3>Ghi chú nhanh</h3><p>{application.notes}</p></section>}
      </aside>
    </div>
    {modal?.kind === 'status' && <StatusModal application={application} onClose={closeModal} onSave={saveStatus} />}
    {modal?.kind === 'note' && <NoteModal onClose={closeModal} onSave={addNote} />}
    {modal?.kind === 'interview' && <InterviewModal application={application} onClose={closeModal} onSave={addInterview} />}
    {modal?.kind === 'task' && <TaskModal initialTitle={modal.initialTitle} onClose={closeModal} onSave={addTask} />}
    {modal?.kind === 'delete' && <ConfirmModal title="Xóa đơn ứng tuyển?" description={`Đơn “${application.jobTitle}” tại ${application.companyName} sẽ không còn xuất hiện trong danh sách và dashboard.`} onClose={closeModal} onConfirm={onDelete} />}
    {statusModal}
  </div>
}
