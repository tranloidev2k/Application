'use client'

import Link from 'next/link'
import { Plus, SearchX, X } from 'lucide-react'
import { Status, STATUS_META } from '../../../types'

/** No application matches the current filters: say which ones, and offer to clear them. */
export function FilteredEmpty({ query, statuses, source, onClear }: { query: string; statuses: Status[]; source: string; onClear: () => void }) {
  const parts = [
    query.trim() && `“${query.trim()}”`,
    statuses.map(status => STATUS_META[status].label).join(', '),
    source && `nguồn ${source}`,
  ].filter(Boolean)
  return <div className="empty-state filtered-empty">
    <span aria-hidden="true"><SearchX size={22} /></span>
    <h2>{parts.length ? `Không có đơn nào khớp ${parts.join(' · ')}` : 'Không có đơn nào phù hợp'}</h2>
    <p>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
    <div className="empty-actions">
      <button type="button" className="primary compact" onClick={onClear}><X size={16} aria-hidden="true" /> Xóa bộ lọc</button>
      <Link className="secondary compact" href="/applications/new"><Plus size={16} aria-hidden="true" /> Thêm đơn mới</Link>
    </div>
  </div>
}
