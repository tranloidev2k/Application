'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export type NavBadge = { count: number; label: string; tone?: 'danger' }

/** One sidebar link. When the sidebar is collapsed only the icon (and the badge, as a corner pill) stays visible. */
export function NavItem({ href, label, icon: Icon, active, collapsed, badge, onNavigate }: {
  href: string; label: string; icon: LucideIcon; active: boolean; collapsed: boolean; badge?: NavBadge; onNavigate?: () => void
}) {
  const badgeText = badge ? `${badge.count} ${badge.label}` : ''
  return <Link
    href={href}
    className={`nav-item ${active ? 'active' : ''}`}
    aria-current={active ? 'page' : undefined}
    title={collapsed ? [label, badgeText].filter(Boolean).join(' · ') : undefined}
    onClick={onNavigate}
  >
    <Icon size={19} aria-hidden="true" />
    <span className="nav-label">{label}</span>
    {badge && <span className={`count-pill ${badge.tone ?? ''}`} title={collapsed ? undefined : badgeText}>
      <span aria-hidden="true">{badge.count}</span><span className="sr-only">{`, ${badgeText}`}</span>
    </span>}
  </Link>
}
