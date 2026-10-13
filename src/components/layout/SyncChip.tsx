'use client'

import Link from 'next/link'
import { LoaderCircle } from 'lucide-react'
import type { SyncState } from '../../context/AppDataContext'

const SYNC_COPY: Record<SyncState, { label: string; hint: string }> = {
  connecting: { label: 'Đang kết nối…', hint: 'Đang kết nối tới máy chủ để đồng bộ dữ liệu.' },
  connected: { label: 'Đã đồng bộ', hint: 'Dữ liệu đã được lưu trên máy chủ và thiết bị này.' },
  offline: { label: 'Chỉ lưu trên thiết bị', hint: 'Chưa kết nối được máy chủ. Dữ liệu vẫn được lưu trên thiết bị này và sẽ đồng bộ khi có kết nối trở lại.' },
}

/** Always-visible sync status in the topbar; links to the account page, which explains where data lives. */
export function SyncChip({ syncState }: { syncState: SyncState }) {
  const { label, hint } = SYNC_COPY[syncState]
  return <Link href="/account" className={`demo-chip sync-chip ${syncState}`} title={hint}>
    {syncState === 'connecting'
      ? <LoaderCircle size={14} className="spin" aria-hidden="true" />
      : <span className="sync-dot" aria-hidden="true" />}
    <span className="sync-label">{label}</span>
  </Link>
}
