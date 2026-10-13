'use client'

import { Plus } from 'lucide-react'
import { Application } from '../../../types'
import { getNextAction } from '../../../utils/nextAction'
import { NextActionSummary } from '../NextActionSummary'

/** 'Việc tiếp theo': the next interview or task, or a quiet way to add one. */
export function NextActionCell({ app, now, onAdd }: { app: Application; now: Date; onAdd: (app: Application) => void }) {
  const next = getNextAction(app, now)
  if (!next) return <button type="button" className="add-next" onClick={() => onAdd(app)} aria-label={`Thêm bước tiếp theo cho đơn ${app.jobTitle}`}>
    <Plus size={14} aria-hidden="true" /><span className="add-next-label">Thêm bước tiếp theo</span>
  </button>
  return <NextActionSummary next={next} now={now} />
}
