'use client'

import Link from 'next/link'
import { Menu, Plus } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext'
import type { Route } from '../../utils/routes'
import { SyncChip } from './SyncChip'
import { TopbarTitle } from './TopbarTitle'

/** Contextual topbar: page title on the left, sync status and the app's single "add application" action on the right. */
export function Topbar({ route, onMenu }: { route: Route; onMenu: () => void }) {
  const { applications, syncState } = useAppData()
  const application = route.id ? applications.find(item => item.id === route.id && !item.deletedAt) : undefined
  const showCta = route.page !== 'new' && route.page !== 'edit'
  return <header className="topbar">
    <button type="button" className="icon-button mobile-only" onClick={onMenu} aria-label="Mở menu"><Menu size={22} /></button>
    <TopbarTitle route={route} application={application} />
    <div className="topbar-actions">
      <SyncChip syncState={syncState} />
      {showCta && <Link href="/applications/new" className={`${route.page === 'calendar' ? 'secondary' : 'primary'} compact topbar-cta`}>
        <Plus size={18} aria-hidden="true" /> Thêm đơn ứng tuyển
      </Link>}
    </div>
  </header>
}
