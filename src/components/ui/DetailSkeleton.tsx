/** Placeholder for the detail/edit routes while data loads: hero line, 4 info blocks and the tab bar. */
export function DetailSkeleton() {
  return <div className="page detail-page detail-skeleton" aria-busy="true">
    <p className="sr-only" role="status">Đang tải đơn ứng tuyển…</p>
    <span className="skeleton sk-back" />
    <div className="detail-hero" aria-hidden="true">
      <div><span className="skeleton sk-eyebrow" /><span className="skeleton sk-title" /><span className="skeleton sk-badge" /></div>
      <div className="detail-actions"><span className="skeleton sk-button" /><span className="skeleton sk-button" /></div>
    </div>
    <div className="detail-layout" aria-hidden="true">
      <div className="detail-main">
        <section className="panel info-panel">
          <div className="info-grid">{[0, 1, 2, 3].map(index => <div className="info-item" key={index}><span className="skeleton sk-icon" /><div><span className="skeleton sk-label" /><span className="skeleton sk-value" /></div></div>)}</div>
        </section>
        <section className="panel activity-panel">
          <div className="tabs sk-tabs">{[0, 1, 2].map(index => <span className="skeleton sk-tab" key={index} />)}</div>
          <div className="sk-rows">{[0, 1, 2].map(index => <span className="skeleton sk-row" key={index} />)}</div>
        </section>
      </div>
      <aside className="detail-aside"><section className="panel"><span className="skeleton sk-label" /><span className="skeleton sk-row" /></section></aside>
    </div>
  </div>
}
