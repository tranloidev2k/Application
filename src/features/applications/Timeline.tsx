'use client'

import { ArrowRight, CalendarDays, NotebookPen, Plus, Trash2 } from 'lucide-react'
import { Application, Note } from '../../types'
import { formatDateTime } from '../../utils/date'

export function Timeline({ application, addNote, update }: { application: Application; addNote: () => void; update: (fn: (a: Application) => Application) => void }) {
  const entries: Array<{ id: string; type: string; createdAt: string; label: string; detail?: string; note?: Note }> = [...application.activities, ...application.appNotes.map(n => ({ id: n.id, type: 'NOTE_ADDED', createdAt: n.createdAt, label: 'Ghi chú', detail: n.content, note: n }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const deleteNote = (id: string) => update(a => ({ ...a, appNotes: a.appNotes.filter(n => n.id !== id), activities: a.activities.filter(x => !(x.type === 'NOTE_ADDED' && x.detail === a.appNotes.find(n => n.id === id)?.content)), updatedAt: new Date().toISOString() }))
  return <div className="tab-content"><div className="tab-toolbar"><h3>Hoạt động gần đây</h3><button className="secondary compact" onClick={addNote}><NotebookPen size={17} /> Thêm ghi chú</button></div>
    <div className="timeline">{entries.map((entry, index) => <div className="timeline-item" key={`${entry.id}-${index}`}>
      <span className={`timeline-icon ${entry.type === 'STATUS_CHANGED' ? 'status' : entry.type === 'NOTE_ADDED' ? 'note' : entry.type.includes('INTERVIEW') ? 'interview' : ''}`}>{entry.type === 'NOTE_ADDED' ? <NotebookPen size={16} /> : entry.type.includes('INTERVIEW') ? <CalendarDays size={16} /> : entry.type === 'CREATED' ? <Plus size={16} /> : <ArrowRight size={16} />}</span>
      <div className="timeline-copy"><div><strong>{entry.label}</strong><time>{formatDateTime(entry.createdAt)}</time></div>{entry.detail && <p>{entry.detail}</p>}{entry.note && <button className="note-delete" onClick={() => deleteNote(entry.note!.id)} aria-label="Xóa ghi chú"><Trash2 size={14} /></button>}</div>
    </div>)}</div>
  </div>
}
