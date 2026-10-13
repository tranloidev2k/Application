'use client'

import { CalendarDays, Plus, Video, X } from 'lucide-react'
import { Interview } from '../../../types'
import { formatDateTime, formatTime } from '../../../utils/date'
import { EmptyTab } from '../../../components/ui/EmptyTab'
import { INTERVIEW_FORMAT_ICONS, InterviewPlace } from './InterviewPlace'

export function Interviews({ interviews, onAdd, onCancel }: { interviews: Interview[]; onAdd: () => void; onCancel: (interview: Interview) => void }) {
  return <div className="tab-content">
    <div className="tab-toolbar"><h3>Các buổi phỏng vấn</h3><button type="button" className="secondary compact" onClick={onAdd}><Plus size={17} /> Tạo lịch</button></div>
    {interviews.length ? <ul className="interview-list">{interviews.map(item => {
      const Icon = INTERVIEW_FORMAT_ICONS[item.format] ?? Video
      return <li className={`interview-card ${item.cancelledAt ? 'cancelled' : ''}`} key={item.id}>
        <span className="interview-format" aria-hidden="true"><Icon /></span>
        <div className="interview-copy">
          <div><strong>{item.title}</strong>{item.cancelledAt && <span className="cancelled-label">Đã hủy</span>}</div>
          <p><CalendarDays size={15} aria-hidden="true" />{formatDateTime(item.startsAt)} – {formatTime(item.endsAt)}</p>
          <InterviewPlace interview={item} />
          {item.interviewer && <small>Với {item.interviewer}</small>}
        </div>
        {!item.cancelledAt && <button type="button" className="icon-button danger-hover" onClick={() => onCancel(item)} aria-label={`Hủy lịch ${item.title}`} title="Hủy lịch"><X size={17} /></button>}
      </li>
    })}</ul> : <EmptyTab icon={<CalendarDays />} title="Chưa có lịch phỏng vấn" text="Tạo lịch để luôn chủ động cho vòng tiếp theo." action="Tạo lịch phỏng vấn" onAction={onAdd} />}
  </div>
}
