import type { SyncState } from '../../context/AppDataContext'
import { PageHeader } from '../../components/layout/PageHeader'

export function AccountPage({ syncState }: { syncState: SyncState }) {
  const storage = syncState === 'connected' ? 'Supabase + thiết bị này' : syncState === 'connecting' ? 'Đang kết nối Supabase' : 'Thiết bị này (chưa đồng bộ)'
  return <div className="page account-page"><PageHeader title="Không gian cá nhân" /><section className="panel account-card"><div className="profile-head"><span className="big-avatar">CN</span><h2>Chế độ cá nhân</h2><span className={`demo-chip ${syncState === 'connected' ? 'connected' : ''}`}>{syncState === 'connected' ? 'Đã kết nối' : 'Cục bộ'}</span></div><div className="account-row"><strong>Nơi lưu dữ liệu</strong><span>{storage}</span></div><div className="account-row"><strong>Múi giờ</strong><span>Asia/Ho_Chi_Minh (GMT+7)</span></div></section></div>
}
