'use client'

import { BriefcaseBusiness, CalendarDays, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react'
import type { Route } from '../../utils/routes'
import { Logo } from './Logo'

export function Sidebar({ route, navigate, open, close, collapsed, toggleCollapsed }: { route: Route; navigate: (s: string) => void; open: boolean; close: () => void; collapsed: boolean; toggleCollapsed: () => void }) {
  const items = [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/', active: route.page === 'dashboard' },
    { label: 'Đơn ứng tuyển', icon: BriefcaseBusiness, path: '/applications', active: ['applications', 'detail', 'edit'].includes(route.page) },
    { label: 'Lịch công việc', icon: CalendarDays, path: '/calendar', active: route.page === 'calendar' },
  ]
  const go = (path: string) => { navigate(path); close() }
  return <>
    {open && <button className="nav-scrim" onClick={close} aria-label="Đóng menu" />}
    <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-head">
        <Logo />
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
        <button className="icon-button mobile-only" onClick={close}><X size={20} /></button>
      </div>
      <nav aria-label="Điều hướng chính">
        {items.map(item => <button key={item.path} className={`nav-item ${item.active ? 'active' : ''}`} onClick={() => go(item.path)} title={collapsed ? item.label : undefined}><item.icon size={19} /><span>{item.label}</span></button>)}
      </nav>
      <div className="sidebar-grow" />
      <button className={`nav-item ${route.page === 'account' ? 'active' : ''}`} onClick={() => go('/account')} title={collapsed ? 'Tài khoản' : undefined}><Settings size={19} /><span>Tài khoản</span></button>
    </aside>
  </>
}
