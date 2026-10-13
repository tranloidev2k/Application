/** Loading columns that mirror the board, so the real cards land without a jump. Rendered during SSR too. */
export function BoardSkeleton() {
  return <section className="panel board-panel board-skeleton" aria-busy="true">
    <span className="sr-only" role="status">Đang tải bảng trạng thái…</span>
    <div className="board-layout" aria-hidden="true">
      <div className="board-viewport"><div className="board">
        {[2, 1, 1, 1, 0].map((cards, column) => <div className="board-column" key={column}>
          <div className="board-column-head"><span className="skeleton sk-head" /></div>
          <div className="board-column-body">
            {Array.from({ length: cards }, (_, card) => <div className="board-card" key={card}>
              <span className="skeleton sk-line" />
              <span className="skeleton sk-line short" />
            </div>)}
          </div>
        </div>)}
      </div></div>
      <div className="board-rails">{[0, 1].map(rail => <div className="board-column board-rail" key={rail} />)}</div>
    </div>
  </section>
}
