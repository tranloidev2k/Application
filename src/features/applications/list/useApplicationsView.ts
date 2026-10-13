'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'next/navigation'

export type ApplicationsView = 'list' | 'board'

const VIEW_STORAGE_KEY = 'trackly-applications-view'

const parseView = (value: string | null): ApplicationsView | null => value === 'board' || value === 'list' ? value : null

function readStoredView() {
  try { return parseView(localStorage.getItem(VIEW_STORAGE_KEY)) } catch { return null }
}

function storeView(view: ApplicationsView) {
  try { localStorage.setItem(VIEW_STORAGE_KEY, view) } catch { /* storage unavailable: the choice still holds for this visit */ }
}

// The stored choice is read once after hydration and only changes through setView, so there is nothing to subscribe to.
const subscribeNever = () => () => {}

/**
 * List or board for /applications. An explicit ?view= wins (and becomes the remembered choice); a drill-down link
 * that filters by status (the dashboard pipeline) opens the list, where that filter lives, without changing the
 * remembered choice; otherwise the last choice from localStorage, then the list.
 * The stored choice is null during SSR and hydration, so the server and first client render agree.
 */
export function useApplicationsView() {
  const params = useSearchParams()
  const [fromUrl] = useState(() => parseView(params.get('view')))
  const [chosen, setChosen] = useState<ApplicationsView | null>(() => fromUrl ?? (params.get('status') ? 'list' : null))
  const stored = useSyncExternalStore(subscribeNever, readStoredView, () => null)
  const view: ApplicationsView = chosen ?? stored ?? 'list'

  useEffect(() => { if (fromUrl) storeView(fromUrl) }, [fromUrl])

  const setView = (next: ApplicationsView) => {
    setChosen(next)
    storeView(next)
  }

  return [view, setView] as const
}
