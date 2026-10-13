'use client'

import Link from 'next/link'
import { CalendarDays, Clock3, Copy, FileText, Link2, MapPin, Plus, Wallet } from 'lucide-react'
import { Application } from '../../../types'
import type { ToastFn } from '../../../context/AppDataContext'
import { formatDate } from '../../../utils/date'
import { ClampText } from '../../../components/ui/ClampText'

/** Every fact the user entered. An empty one is a muted 'Thêm' link to the edit form instead of a dash. */
export function InfoPanel({ application, toast }: { application: Application; toast: ToastFn }) {
  const editHref = `/applications/${application.id}/edit`
  const facts = [
    { icon: MapPin, label: 'Địa điểm', value: application.location },
    { icon: CalendarDays, label: 'Ngày ứng tuyển', value: application.appliedAt && formatDate(application.appliedAt) },
    { icon: Clock3, label: 'Hạn nộp', value: application.deadlineAt && formatDate(application.deadlineAt) },
    { icon: Link2, label: 'Nguồn', value: application.source },
    { icon: Wallet, label: 'Mức lương', value: application.salaryText },
  ]

  const copyCv = async () => {
    try {
      await navigator.clipboard.writeText(application.cvContent ?? '')
      toast('Đã sao chép nội dung CV')
    } catch {
      toast('Không thể sao chép. Hãy chọn và sao chép nội dung CV thủ công.', { tone: 'error' })
    }
  }

  return <section className="panel info-panel" aria-label="Thông tin đơn ứng tuyển">
    <dl className="info-grid">{facts.map(fact => <div className="info-item" key={fact.label}>
      <dt><fact.icon size={15} aria-hidden="true" />{fact.label}</dt>
      <dd>{fact.value?.trim()
        ? <span title={fact.value}>{fact.value}</span>
        : <Link className="info-add" href={editHref} aria-label={`Thêm ${fact.label.toLowerCase()}`}><Plus size={14} aria-hidden="true" />Thêm</Link>}</dd>
    </div>)}</dl>
    {application.description && <div className="description">
      <h3>Mô tả công việc</h3>
      <ClampText text={application.description} />
    </div>}
    {application.cvContent && <div className="description cv-content">
      <div className="description-head">
        <h3><FileText size={17} aria-hidden="true" /> Nội dung CV đã sử dụng</h3>
        <button type="button" className="text-button" onClick={() => void copyCv()}><Copy size={15} aria-hidden="true" /> Sao chép CV</button>
      </div>
      <ClampText text={application.cvContent} className="cv-box" />
    </div>}
  </section>
}
