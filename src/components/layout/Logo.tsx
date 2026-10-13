import Link from 'next/link'
import { BriefcaseBusiness } from 'lucide-react'

export function Logo({ onNavigate }: { onNavigate?: () => void }) {
  return <Link href="/" className="logo" aria-label="Trackly — Tổng quan" onClick={onNavigate}>
    <span className="logo-mark" aria-hidden="true"><BriefcaseBusiness size={19} /></span>
    <span className="logo-text" aria-hidden="true">trackly</span>
  </Link>
}
