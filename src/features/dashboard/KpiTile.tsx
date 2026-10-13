'use client'

import Link from 'next/link'
import { ChevronRight, LucideIcon } from 'lucide-react'

type KpiTileProps = { icon: LucideIcon; label: string; value: number; href: string; hint?: string; hintTone?: 'danger' }

/** A compact metric tile (about 88px tall) that links to the matching filtered list or calendar week. */
export function KpiTile({ icon: Icon, label, value, href, hint, hintTone }: KpiTileProps) {
  return <Link className="kpi-tile" href={href}>
    <span className="kpi-icon" aria-hidden="true"><Icon size={18} /></span>
    <span className="kpi-copy">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value-row">
        <strong className="kpi-value">{value}</strong>
        {hint && <small className={`kpi-hint ${hintTone ?? ''}`}>{hint}</small>}
      </span>
    </span>
    <ChevronRight className="kpi-chevron" size={18} aria-hidden="true" />
  </Link>
}
