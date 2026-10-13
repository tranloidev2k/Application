'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Application, Status } from '../../../types'
import { countByStatus, matchesQuery, PAGE_SIZE, parsePage, parseSort, parseStatuses, sortApplications, SortKey } from './applicationsQuery'

/**
 * Search, source, status, sort and page for /applications, initialised from the URL and mirrored back with
 * replaceState (q, status, source, sort, page). Status counts are taken after the search and source filters and
 * before the status filter. `page` is clamped to the last page by derivation, never by an effect.
 * While `paused` (data still loading) the URL is left untouched so a shared link survives the first render.
 */
export function useApplicationsQuery(applications: Application[], paused: boolean) {
  const params = useSearchParams()
  const [query, setQueryState] = useState(() => params.get('q') || '')
  const [statuses, setStatusesState] = useState<Status[]>(() => parseStatuses(params.get('status')))
  const [source, setSourceState] = useState(() => params.get('source') || '')
  const [sort, setSortState] = useState<SortKey>(() => parseSort(params.get('sort')))
  const [page, setPage] = useState(() => parsePage(params.get('page')))

  const live = useMemo(() => applications.filter(app => !app.deletedAt), [applications])
  const sources = useMemo(() => {
    const values = new Set(live.map(app => app.source).filter((value): value is string => Boolean(value)))
    if (source) values.add(source)
    return [...values].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [live, source])
  const searched = useMemo(() => live.filter(app => matchesQuery(app, query) && (!source || app.source === source)), [live, query, source])
  const statusCounts = useMemo(() => countByStatus(searched), [searched])
  const filtered = useMemo(() => sortApplications(statuses.length ? searched.filter(app => statuses.includes(app.status)) : searched, sort), [searched, statuses, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  useEffect(() => {
    if (paused) return
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (statuses.length) next.set('status', statuses.join(','))
    if (source) next.set('source', source)
    if (sort !== 'updated') next.set('sort', sort)
    if (current > 1) next.set('page', String(current))
    window.history.replaceState({}, '', `/applications${next.size ? `?${next}` : ''}`)
  }, [paused, query, statuses, source, sort, current])

  // Every filter change starts again from page 1.
  const setQuery = (value: string) => { setQueryState(value); setPage(1) }
  const setStatuses = (value: Status[]) => { setStatusesState(value); setPage(1) }
  const setSource = (value: string) => { setSourceState(value); setPage(1) }
  const setSort = (value: SortKey) => { setSortState(value); setPage(1) }
  const clear = () => { setQueryState(''); setStatusesState([]); setSourceState(''); setSortState('updated'); setPage(1) }

  return {
    live, sources, statusCounts, filtered, pageItems,
    /** Applications left after search and source, before the status filter ('Tất cả'). */
    searchedCount: searched.length,
    query, statuses, source, sort,
    page: current, totalPages,
    filtersActive: Boolean(query || statuses.length || source || sort !== 'updated'),
    setQuery, setStatuses, setSource, setSort, setPage, clear,
  }
}
