/** Loading state that mirrors the dashboard's sections, so the real page lands without a jump. Rendered during SSR too. */
export function DashboardSkeleton() {
  return <div className="page dashboard-page dashboard-skeleton" aria-busy="true">
    <span className="sr-only" role="status">Đang tải tổng quan…</span>
    <div className="dashboard-greeting" aria-hidden="true">
      <span className="skeleton sk-date" />
      <span className="skeleton sk-greeting" />
      <span className="skeleton sk-summary" />
    </div>
    <div className="next-strip" aria-hidden="true">
      <span className="skeleton sk-section-title" />
      <div className="next-strip-cards">
        {[0, 1, 2].map(index => <div className="next-card" key={index}>
          <span className="skeleton next-card-icon" />
          <div className="next-card-body"><span className="skeleton sk-line short" /><span className="skeleton sk-line" /><span className="skeleton sk-line mid" /></div>
        </div>)}
      </div>
    </div>
    <div className="kpi-grid" aria-hidden="true">
      {[0, 1, 2, 3].map(index => <div className="kpi-tile" key={index}>
        <span className="skeleton kpi-icon" />
        <span className="kpi-copy"><span className="skeleton sk-line mid" /><span className="skeleton sk-value" /></span>
      </div>)}
    </div>
    <div className="dashboard-grid" aria-hidden="true">
      {[0, 1].map(index => <div className="panel" key={index}>
        <div className="panel-head"><span className="skeleton sk-panel-title" /></div>
        <div className="sk-rows">{[0, 1, 2].map(row => <span className="skeleton sk-row" key={row} />)}</div>
      </div>)}
    </div>
    <div className="panel pipeline" aria-hidden="true">
      <div className="panel-head"><span className="skeleton sk-panel-title" /></div>
      <div className="sk-rows sk-pipeline">{[0, 1, 2, 3, 4].map(step => <span className="skeleton sk-step" key={step} />)}</div>
    </div>
  </div>
}
