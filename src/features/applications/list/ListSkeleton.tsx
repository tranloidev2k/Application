/** Loading rows that mirror the table's columns, so the real list lands without a jump. Rendered during SSR too. */
export function ListSkeleton() {
  return <section className="table-panel list-skeleton" aria-busy="true">
    <span className="sr-only" role="status">Đang tải danh sách đơn ứng tuyển…</span>
    <div className="application-table" aria-hidden="true">
      <div className="table-row table-header">{[0, 1, 2, 3].map(index => <span key={index}><span className="skeleton sk-head" /></span>)}<span /></div>
      {[0, 1, 2, 3].map(index => <div className="table-row skeleton-row" key={index}>
        <div className="job-cell"><span className="skeleton sk-monogram" /><div className="job-copy"><span className="skeleton sk-line" /><span className="skeleton sk-line short" /></div></div>
        <div><span className="skeleton sk-badge" /></div>
        <div><span className="skeleton sk-line mid" /></div>
        <div className="timeline-cell"><span className="skeleton sk-line mid" /><span className="skeleton sk-line short" /></div>
        <div />
      </div>)}
    </div>
  </section>
}
