'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Filter, ListTodo, Pencil, Search, Trash2, X } from 'lucide-react'
import { Application, STATUSES, STATUS_META } from '../../types'
import { formatDate, formatDateTime } from '../../utils/date'
import { PageHeader } from '../../components/layout/PageHeader'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { StatusBadge } from '../../components/ui/StatusBadge'

export function ApplicationsPage({ applications, navigate, onDelete }: { applications: Application[]; navigate: (s: string) => void; onDelete: (id: string) => void }) {
  const params = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [status, setStatus] = useState(params.get('status') || '')
  const [source, setSource] = useState(params.get('source') || '')
  const [sort, setSort] = useState(params.get('sort') || 'updated')
  const [page, setPage] = useState(Number(params.get('page') || 1))
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const pageSize = 8
  const sources = [...new Set(applications.map(a => a.source).filter(Boolean))] as string[]

  useEffect(() => {
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (status) p.set('status', status)
    if (source) p.set('source', source)
    if (sort !== 'updated') p.set('sort', sort)
    if (page > 1) p.set('page', String(page))
    window.history.replaceState({}, '', `/applications${p.size ? `?${p}` : ''}`)
  }, [query, status, source, sort, page])

  const filtered = useMemo(() => applications.filter(a => !a.deletedAt)
    .filter(a => !query || `${a.companyName} ${a.jobTitle}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
    .filter(a => !status || status.split(',').includes(a.status))
    .filter(a => !source || a.source === source)
    .sort((a, b) => sort === 'company' ? a.companyName.localeCompare(b.companyName) : sort === 'applied' ? (b.appliedAt || '').localeCompare(a.appliedAt || '') : b.updatedAt.localeCompare(a.updatedAt)), [applications, query, status, source, sort])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)
  const clear = () => { setQuery(''); setStatus(''); setSource(''); setSort('updated'); setPage(1) }

  return <div className="page applications-page">
    <PageHeader title="Đơn ứng tuyển" />
    <div className="filter-bar">
      <label className="search-box"><Search size={18} /><input aria-label="Tìm kiếm" placeholder="Tìm công ty hoặc vị trí..." value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} /></label>
      <label className="select-control"><Filter size={17} /><select aria-label="Lọc trạng thái" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="">Mọi trạng thái</option>{STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}</select><ChevronDown size={15} /></label>
      <label className="select-control"><select aria-label="Lọc nguồn" value={source} onChange={e => { setSource(e.target.value); setPage(1) }}><option value="">Mọi nguồn</option>{sources.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={15} /></label>
      <label className="select-control"><select aria-label="Sắp xếp" value={sort} onChange={e => setSort(e.target.value)}><option value="updated">Mới cập nhật</option><option value="applied">Ngày ứng tuyển</option><option value="company">Tên công ty</option></select><ChevronDown size={15} /></label>
    </div>
    {(query || status || source || sort !== 'updated') && <div className="active-filter"><span>{filtered.length} kết quả phù hợp</span><button onClick={clear}><X size={14} /> Xóa bộ lọc</button></div>}
    <section className="table-panel">
      {pageItems.length ? <>
        <div className="application-table">
          <div className="table-row table-header"><span>Vị trí</span><span>Công ty</span><span>Trạng thái</span><span>Việc tiếp theo</span><span>Hạn nộp</span><span>Thao tác</span></div>
          {pageItems.map(app => {
            const deadlineDays = app.deadlineAt ? Math.ceil((new Date(`${app.deadlineAt}T23:59:59`).getTime() - new Date().getTime()) / 864e5) : null
            const openTask = app.tasks.find(task => !task.completedAt)
            const nextInterview = app.interviews.filter(interview => !interview.cancelledAt && new Date(interview.startsAt) >= new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
            return <div className="table-row" role="button" tabIndex={0} key={app.id} onClick={() => navigate(`/applications/${app.id}`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') navigate(`/applications/${app.id}`) }}>
              <span className="position-cell" data-label="Vị trí"><strong>{app.jobTitle}</strong></span>
              <span className="company-cell" data-label="Công ty"><strong>{app.companyName}</strong></span>
              <span className="status-cell" data-label="Trạng thái"><StatusBadge status={app.status} /></span>
              <span className="next-action-cell" data-label="Việc tiếp theo">{nextInterview ? <><strong><CalendarDays size={14} /> Phỏng vấn</strong><small>{formatDateTime(nextInterview.startsAt)}</small></> : openTask ? <><strong><ListTodo size={14} /> {openTask.title}</strong><small>{openTask.dueAt ? formatDateTime(openTask.dueAt) : 'Chưa có thời hạn'}</small></> : <em>Chưa có việc tiếp theo</em>}</span>
              <span data-label="Hạn nộp" className={`deadline-cell ${deadlineDays !== null && deadlineDays <= 3 ? 'urgent' : ''}`}><strong>{formatDate(app.deadlineAt)}</strong><small>{deadlineDays === null ? 'Không có hạn' : deadlineDays < 0 ? 'Đã quá hạn' : deadlineDays === 0 ? 'Hết hạn hôm nay' : `Còn ${deadlineDays} ngày`}</small></span>
              <span className="row-actions"><button onClick={event => { event.stopPropagation(); navigate(`/applications/${app.id}/edit`) }} aria-label={`Sửa đơn ${app.jobTitle}`} title="Sửa"><Pencil size={15} /></button><button className="delete" onClick={event => { event.stopPropagation(); setDeleteTarget(app) }} aria-label={`Xóa đơn ${app.jobTitle}`} title="Xóa"><Trash2 size={15} /></button></span>
            </div>
          })}
        </div>
        <div className="pagination"><span>Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} trong {filtered.length}</span><div><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17} /></button><span>Trang {page}/{totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={17} /></button></div></div>
      </> : <div className="empty-state"><span><Search /></span><h2>Không tìm thấy đơn phù hợp</h2><p>Thử thay đổi từ khóa hoặc xóa bớt bộ lọc.</p><button className="secondary" onClick={clear}>Xóa bộ lọc</button></div>}
    </section>
    {deleteTarget && <ConfirmModal title="Xóa đơn ứng tuyển?" description={`Đơn “${deleteTarget.jobTitle}” tại ${deleteTarget.companyName} sẽ không còn xuất hiện trong danh sách và dashboard.`} onClose={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null) }} />}
  </div>
}
