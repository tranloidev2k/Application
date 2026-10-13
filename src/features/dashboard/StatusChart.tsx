'use client'

import { Application, STATUSES, STATUS_META } from '../../types'
import { STATUS_CHART_COLORS } from '../../utils/status'

export function StatusChart({ applications, navigate }: { applications: Application[]; navigate: (path: string) => void }) {
  const total = applications.length
  const data = STATUSES.map(status => ({ status, count: applications.filter(application => application.status === status).length })).filter(item => item.count > 0)
  let offset = 0
  const segments = data.map(item => {
    const start = offset
    offset += total ? item.count / total * 100 : 0
    return `${STATUS_CHART_COLORS[item.status]} ${start}% ${offset}%`
  })
  const chartBackground = total ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(var(--line) 0 100%)'
  return <section className="status-chart-card">
    <div className="status-chart-copy"><h2>Tiến độ ứng tuyển</h2></div>
    <div className="status-chart-body">
      <button className="status-donut" style={{ background: chartBackground }} onClick={() => navigate('/applications')} aria-label={`${total} đơn ứng tuyển`}>
        <span><strong>{total}</strong><small>Tổng đơn</small></span>
      </button>
      <div className="status-chart-legend">
        {data.map(item => <button key={item.status} onClick={() => navigate(`/applications?status=${item.status}`)}><i style={{ background: STATUS_CHART_COLORS[item.status] }} /><span>{STATUS_META[item.status].label}</span><strong>{item.count}</strong></button>)}
        {!data.length && <p>Chưa có dữ liệu ứng tuyển.</p>}
      </div>
    </div>
  </section>
}
