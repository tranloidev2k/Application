'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

/** 'Hiển thị x–y trong n' always; previous/next only when there is more than one page. */
export function Pagination({ page, totalPages, pageSize, total, onPage }: { page: number; totalPages: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return <div className="pagination">
    <span>Hiển thị {from}–{to} trong {total}</span>
    {totalPages > 1 && <nav aria-label="Phân trang">
      <button type="button" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={17} aria-hidden="true" /></button>
      <span>Trang {page}/{totalPages}</span>
      <button type="button" aria-label="Trang sau" disabled={page >= totalPages} onClick={() => onPage(page + 1)}><ChevronRight size={17} aria-hidden="true" /></button>
    </nav>}
  </div>
}
