'use client'

import { BriefcaseBusiness, CalendarDays, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext'
import type { Route } from '../../utils/routes'
import { isActiveApplication } from '../../utils/status'
import { countOverdueTasks } from '../../utils/tasks'
import { Logo } from './Logo'
import { NavBadge, NavItem } from './NavItem'

export function Sidebar({ route, open, close, collapsed, toggleCollapsed }: { route: Route; open: boolean; close: () => void; collapsed: boolean; toggleCollapsed: () => void }) {
  const { applications, ready } = useAppData()
  // Counts come from the local cache and the clock, so they only render on the client once `ready` (never during SSR).
  const activeCount = ready ? applications.filter(isActiveApplication).length : 0
  const overdueCount = ready ? countOverdueTasks(applications, new Date()) : 0
  const activeBadge: NavBadge | undefined = activeCount ? { count: activeCount, label: 'đơn đang hoạt động' } : undefined
  const overdueBadge: NavBadge | undefined = overdueCount ? { count: overdueCount, label: 'việc quá hạn', tone: 'danger' } : undefined
  const items = [
    { label: 'Lịch công việc', icon: CalendarDays, href: '/calendar', active: route.page === 'calendar', badge: overdueBadge },
    { label: 'Tổng quan', icon: LayoutDashboard, href: '/', active: route.page === 'dashboard' },
    { label: 'Đơn ứng tuyển', icon: BriefcaseBusiness, href: '/applications', active: ['applications', 'detail', 'edit', 'new'].includes(route.page), badge: activeBadge },
  ]
  return <>
    {open && <button type="button" className="nav-scrim" onClick={close} aria-label="Đóng menu" />}
    <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-head">
        <Logo onNavigate={close} />
        <button
          type="button"
          className="sidebar-collapse-button desktop-only"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <button type="button" className="icon-button mobile-only" onClick={close} aria-label="Đóng menu"><X size={20} /></button>
      </div>
      <nav aria-label="Điều hướng chính">
        {items.map(item => <NavItem key={item.href} {...item} collapsed={collapsed} onNavigate={close} />)}
      </nav>
      <div className="sidebar-grow" />
      <NavItem href="/account" label="Tài khoản" icon={Settings} active={route.page === 'account'} collapsed={collapsed} onNavigate={close} />
    </aside>
  </>
}
