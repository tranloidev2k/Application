'use client'

import { ArrowRight, CalendarDays, Check, NotebookPen, Plus, Trash2 } from 'lucide-react'
import { formatDateTime, formatFullDateTime, formatTimeAgo } from '../../../utils/date'
import { EmptyTab } from '../../../components/ui/EmptyTab'
import type { TimelineEntry } from './timelineEntries'

function entryTone(entry: TimelineEntry) {
  if (entry.type === 'STATUS_CHANGED') return 'status'
  if (entry.type === 'NOTE_ADDED') return 'note'
  if (entry.type === 'TASK_COMPLETED') return 'task'
  return entry.type.startsWith('INTERVIEW') ? 'interview' : ''
}

function EntryIcon({ entry }: { entry: TimelineEntry }) {
  if (entry.type === 'NOTE_ADDED') return <NotebookPen size={16} />
  if (entry.type.startsWith('INTERVIEW')) return <CalendarDays size={16} />
  if (entry.type === 'TASK_COMPLETED') return <Check size={16} />
  if (entry.type === 'CREATED') return <Plus size={16} />
  return <ArrowRight size={16} />
}

/** Activity history and notes, newest first. `entries` is computed once by the page, so the tab count always matches. */
export function Timeline({ entries, now, onAddNote, onDeleteNote }: { entries: TimelineEntry[]; now: Date | null; onAddNote: () => void; onDeleteNote: (noteId: string) => void }) {
  return <div className="tab-content">
    <div className="tab-toolbar"><h3>Hoạt động gần đây</h3><button type="button" className="secondary compact" onClick={onAddNote}><NotebookPen size={17} /> Thêm ghi chú</button></div>
    {entries.length ? <ol className="timeline">{entries.map(entry => <li className="timeline-item" key={entry.key}>
      <span className={`timeline-icon ${entryTone(entry)}`} aria-hidden="true"><EntryIcon entry={entry} /></span>
      <div className="timeline-copy">
        <div className="timeline-head">
          <strong>{entry.label}</strong>
          <time dateTime={entry.createdAt} title={formatFullDateTime(entry.createdAt)}>{now ? formatTimeAgo(entry.createdAt, now) : formatDateTime(entry.createdAt)}</time>
        </div>
        {entry.note
          ? <div className="timeline-note">
            <p>{entry.detail}</p>
            <button type="button" className="icon-button danger-hover note-delete" onClick={() => onDeleteNote(entry.note!.id)} aria-label="Xóa ghi chú" title="Xóa ghi chú"><Trash2 size={15} /></button>
          </div>
          : entry.detail && <p className="timeline-detail">{entry.detail}</p>}
      </div>
    </li>)}</ol> : <EmptyTab icon={<NotebookPen />} title="Chưa có hoạt động" text="Ghi chú và mọi thay đổi của đơn sẽ hiện ở đây." action="Thêm ghi chú" onAction={onAddNote} />}
  </div>
}
