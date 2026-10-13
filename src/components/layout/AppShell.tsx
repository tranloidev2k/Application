'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { routeFromPathname } from '../../utils/routes'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const SIDEBAR_STORAGE_KEY = 'trackly-sidebar-collapsed'

export function AppShell({ children }: { children: ReactNode }) {
  const route = routeFromPathname(usePathname())
  const [mobileNav, setMobileNav] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const collapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    queueMicrotask(() => setSidebarCollapsed(collapsed))
  }, [])
  useEffect(() => localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed)), [sidebarCollapsed])

  return (
    <div className="app-shell">
      <Sidebar route={route} open={mobileNav} close={() => setMobileNav(false)} collapsed={sidebarCollapsed} toggleCollapsed={() => setSidebarCollapsed(value => !value)} />
      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar route={route} onMenu={() => setMobileNav(true)} />
        <main>{children}</main>
      </div>
    </div>
  )
}
