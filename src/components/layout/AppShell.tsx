'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigate } from '../../hooks/useNavigate'
import { routeFromPathname } from '../../utils/routes'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const SIDEBAR_STORAGE_KEY = 'trackly-sidebar-collapsed'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const navigate = useNavigate()
  const route = routeFromPathname(pathname)
  const [mobileNav, setMobileNav] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const collapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    queueMicrotask(() => setSidebarCollapsed(collapsed))
  }, [])
  useEffect(() => localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed)), [sidebarCollapsed])

  return (
    <div className="app-shell">
      <Sidebar route={route} navigate={navigate} open={mobileNav} close={() => setMobileNav(false)} collapsed={sidebarCollapsed} toggleCollapsed={() => setSidebarCollapsed(value => !value)} />
      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar onMenu={() => setMobileNav(true)} navigate={navigate} />
        <main>{children}</main>
      </div>
    </div>
  )
}
