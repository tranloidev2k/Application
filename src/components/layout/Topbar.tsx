'use client'

import { Menu, Plus } from 'lucide-react'

export function Topbar({ onMenu, navigate }: { onMenu: () => void; navigate: (s: string) => void }) {
  return <header className="topbar">
    <button className="icon-button mobile-only" onClick={onMenu} aria-label="Mở menu"><Menu size={22} /></button>
    <div className="topbar-title" />
    <button className="primary compact" onClick={() => navigate('/applications/new')}><Plus size={18} /> Thêm đơn</button>
  </header>
}
