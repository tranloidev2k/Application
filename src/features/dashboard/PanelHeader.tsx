'use client'

import { ArrowRight } from 'lucide-react'

export function PanelHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="panel-head"><h2>{title}</h2><button className="text-button" onClick={onAction}>{action}<ArrowRight size={16} /></button></div>
}
