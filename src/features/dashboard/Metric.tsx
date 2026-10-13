'use client'

export function Metric({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return <button className="metric-card action-metric" onClick={onClick}><span><small>{label}</small><strong>{value}</strong></span></button>
}
