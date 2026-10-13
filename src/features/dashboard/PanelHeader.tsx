'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function PanelHeader({ id, title, action, href }: { id: string; title: string; action: string; href: string }) {
  return <div className="panel-head">
    <h2 id={id}>{title}</h2>
    <Link className="text-button" href={href}>{action}<ArrowRight size={16} aria-hidden="true" /></Link>
  </div>
}
