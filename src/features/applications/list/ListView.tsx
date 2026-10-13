'use client'

import { X } from 'lucide-react'
import { ApplicationsTable } from './ApplicationsTable'
import type { RowHandlers } from './ApplicationRow'
import { PAGE_SIZE } from './applicationsQuery'
import { FilteredEmpty } from './FilteredEmpty'
import { Pagination } from './Pagination'
import { StatusTabs } from './StatusTabs'
import type { ApplicationsQuery } from './useApplicationsQuery'

/** The list view below the filter bar: status tabs, the result line, then a page of rows or a no-match state. */
export function ListView({ list, now, ...handlers }: { list: ApplicationsQuery; now: Date } & RowHandlers) {
  return <>
    <StatusTabs total={list.searchedCount} counts={list.statusCounts} selected={list.statuses} onChange={list.setStatuses} />
    {list.filtersActive && <div className="active-filter">
      <span>{list.filtered.length} kết quả phù hợp</span>
      <button type="button" onClick={list.clear}><X size={14} aria-hidden="true" /> Xóa bộ lọc</button>
    </div>}
    <section className="table-panel">
      {list.pageItems.length ? <>
        <ApplicationsTable items={list.pageItems} now={now} {...handlers} />
        <Pagination page={list.page} totalPages={list.totalPages} pageSize={PAGE_SIZE} total={list.filtered.length} onPage={list.setPage} />
      </> : <FilteredEmpty query={list.query} statuses={list.statuses} source={list.source} onClear={list.clear} />}
    </section>
  </>
}
