'use client'

import { AlertCircle } from 'lucide-react'

export function NotFound({ navigate }: { navigate: (s: string) => void }) { return <div className="page"><div className="empty-state large"><span><AlertCircle /></span><h1>Không tìm thấy đơn ứng tuyển</h1><p>Đơn này không tồn tại hoặc đã được xóa.</p><button className="primary" onClick={() => navigate('/applications')}>Về danh sách</button></div></div> }
