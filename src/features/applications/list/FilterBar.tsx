'use client'

import { ChevronDown, Search } from 'lucide-react'
import { SORT_OPTIONS, SortKey } from './applicationsQuery'

/** Search, source and sort. Status filtering lives in StatusTabs. */
export function FilterBar({ query, onQuery, source, sources, onSource, sort, onSort }: {
  query: string
  onQuery: (value: string) => void
  source: string
  sources: string[]
  onSource: (value: string) => void
  sort: SortKey
  onSort: (value: SortKey) => void
}) {
  return <div className="filter-bar">
    <label className="search-box">
      <Search size={18} aria-hidden="true" />
      <input aria-label="Tìm kiếm" placeholder="Tìm công ty hoặc vị trí..." value={query} onChange={event => onQuery(event.target.value)} />
    </label>
    <label className="select-control">
      <select aria-label="Lọc nguồn" value={source} onChange={event => onSource(event.target.value)}>
        <option value="">Mọi nguồn</option>
        {sources.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
    <label className="select-control sort-control">
      <span className="select-prefix" aria-hidden="true">Sắp xếp:</span>
      <select aria-label="Sắp xếp" value={sort} onChange={event => onSort(event.target.value as SortKey)}>
        {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  </div>
}
