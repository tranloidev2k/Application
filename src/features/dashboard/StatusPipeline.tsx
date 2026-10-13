'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Status, STATUS_META } from '../../types'

const STEPS: Status[] = ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']
// Decorative bar widths for the first-run preview (no numbers, so a new user never sees zeros).
const GHOST_WIDTHS: Record<string, number> = { SAVED: 80, APPLIED: 60, SCREENING: 40, INTERVIEW: 25, OFFER: 12 }

type StatusPipelineProps = { counts: Record<Status, number>; total: number; ghost?: false } | { ghost: true; counts?: undefined; total?: undefined }

/** Stage pipeline SAVED → OFFER with a count, a label and a bar per step; closed outcomes on one muted line below. */
export function StatusPipeline(props: StatusPipelineProps) {
  const ghost = props.ghost === true
  return <section className={`panel pipeline ${ghost ? 'ghost' : ''}`} aria-labelledby={ghost ? undefined : 'pipeline-title'} aria-hidden={ghost || undefined}>
    <div className="panel-head">
      <h2 id={ghost ? undefined : 'pipeline-title'}>Tiến độ ứng tuyển{ghost ? '' : ` · ${props.total} đơn`}</h2>
    </div>
    <ol className="pipeline-steps">
      {STEPS.map((status, index) => {
        const label = STATUS_META[status].label
        const count = props.ghost ? 0 : props.counts[status]
        const width = props.ghost ? GHOST_WIDTHS[status] : props.total ? count / props.total * 100 : 0
        const content = <>
          {!ghost && <span className="pipeline-count">{count}</span>}
          <span className="pipeline-label">{label}</span>
          <span className="pipeline-bar"><i style={{ width: `${width}%` }} /></span>
        </>
        return <li key={status} className={`pipeline-step step-${status.toLowerCase()} ${!ghost && !count ? 'is-empty' : ''}`}>
          {index > 0 && <ChevronRight className="pipeline-arrow" size={14} aria-hidden="true" />}
          {ghost
            ? <div className="pipeline-step-body">{content}</div>
            : <Link className="pipeline-step-body" href={`/applications?status=${status}`} aria-label={`${label}: ${count} đơn`}>{content}</Link>}
        </li>
      })}
    </ol>
    {!props.ghost && <p className="pipeline-closed">
      Đã đóng: <Link href="/applications?status=REJECTED">{props.counts.REJECTED} bị từ chối</Link> · <Link href="/applications?status=WITHDRAWN">{props.counts.WITHDRAWN} đã rút</Link>
    </p>}
  </section>
}
