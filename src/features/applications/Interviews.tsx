'use client'

import { CalendarDays, MapPin, Phone, Plus, Video, X } from 'lucide-react'
import { Application, Interview } from '../../types'
import type { ToastFn } from '../../context/AppDataContext'
import { formatDateTime, formatTime } from '../../utils/date'
import { uid } from '../../utils/id'
import { EmptyTab } from '../../components/ui/EmptyTab'

export function Interviews({ application, onAdd, update, toast }: { application: Application; onAdd: () => void; update: (fn: (a: Application) => Application) => void; toast: ToastFn }) {
  const cancel = (item: Interview) => {
    const now = new Date().toISOString()
    update(a => ({ ...a, interviews: a.interviews.map(i => i.id === item.id ? { ...i, cancelledAt: now } : i), activities: [{ id: uid(), type: 'INTERVIEW_CANCELLED', createdAt: now, label: 'Đã hủy lịch phỏng vấn', detail: item.title }, ...a.activities] })); toast('Đã hủy lịch phỏng vấn')
  }
  return <div className="tab-content"><div className="tab-toolbar"><h3>Các buổi phỏng vấn</h3><button className="secondary compact" onClick={onAdd}><Plus size={17} /> Tạo lịch</button></div>
    {application.interviews.length ? <div className="interview-list">{application.interviews.map(i => <div className={`interview-card ${i.cancelledAt ? 'cancelled' : ''}`} key={i.id}><span className="interview-format">{i.format === 'online' ? <Video /> : i.format === 'phone' ? <Phone /> : <MapPin />}</span><div><div><strong>{i.title}</strong>{i.cancelledAt && <span className="cancelled-label">Đã hủy</span>}</div><p><CalendarDays size={15} />{formatDateTime(i.startsAt)} – {formatTime(i.endsAt)}</p>{i.interviewer && <small>Với {i.interviewer}</small>}</div>{!i.cancelledAt && <button className="icon-button danger-hover" onClick={() => cancel(i)} aria-label="Hủy lịch"><X size={17} /></button>}</div>)}</div> : <EmptyTab icon={<CalendarDays />} title="Chưa có lịch phỏng vấn" text="Tạo lịch để luôn chủ động cho vòng tiếp theo." action="Tạo lịch phỏng vấn" onAction={onAdd} />}
  </div>
}
