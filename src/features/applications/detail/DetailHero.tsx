'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Application, Status, STATUS_META } from '../../../types'
import { isClosedStatus, nextStage } from '../../../utils/status'
import { isHttpUrl } from '../../../utils/url'
import { StageStepper } from './StageStepper'

/**
 * Title, the one-click stage actions and the stepper. The primary button advances one stage (hidden at OFFER) or,
 * for a closed application, reopens it through StatusModal. Status menus and dialogs are never inside a form here.
 */
export function DetailHero({ application, onSelectStatus, onOtherStatus, onDelete }: {
  application: Application
  onSelectStatus: (status: Status) => void
  onOtherStatus: () => void
  onDelete: () => void
}) {
  const closed = isClosedStatus(application.status)
  const next = nextStage(application.status)
  const jobUrl = application.jobUrl?.trim()

  return <div className="detail-hero">
    <div className="detail-title">
      <div className="eyebrow">{application.companyName}</div>
      <h1>{application.jobTitle}</h1>
    </div>
    <div className="detail-actions">
      {closed
        ? <button type="button" className="primary" onClick={onOtherStatus}><RotateCcw size={16} aria-hidden="true" /> Mở lại đơn</button>
        : next && <button type="button" className="primary" onClick={() => onSelectStatus(next)}>Chuyển sang {STATUS_META[next].label} <ArrowRight size={16} aria-hidden="true" /></button>}
      <Link className="secondary" href={`/applications/${application.id}/edit`}><Pencil size={16} aria-hidden="true" /> Chỉnh sửa</Link>
      {jobUrl && <a className="secondary" href={isHttpUrl(jobUrl) ? jobUrl : `https://${jobUrl}`} target="_blank" rel="noopener noreferrer">
        Tin gốc <ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (mở trong tab mới)</span>
      </a>}
      <button type="button" className="icon-button danger-hover" onClick={onDelete} aria-label="Xóa đơn" title="Xóa đơn"><Trash2 size={18} /></button>
    </div>
    <StageStepper status={application.status} onSelect={onSelectStatus} onOtherStatus={onOtherStatus} />
  </div>
}
