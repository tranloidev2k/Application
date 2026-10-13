'use client'

import { Application } from '../../../types'
import { ApplicationRow, RowHandlers } from './ApplicationRow'

/** A div grid exposed as an ARIA table: header row of column headers, then one row per application. */
export function ApplicationsTable({ items, now, ...handlers }: { items: Application[]; now: Date } & RowHandlers) {
  return <div className="application-table" role="table" aria-label="Danh sách đơn ứng tuyển">
    <div className="table-row table-header" role="row">
      <span role="columnheader">Công việc</span>
      <span role="columnheader">Trạng thái</span>
      <span role="columnheader">Việc tiếp theo</span>
      <span role="columnheader">Mốc thời gian</span>
      <span role="columnheader"><span className="sr-only">Thao tác</span></span>
    </div>
    {items.map(app => <ApplicationRow key={app.id} app={app} now={now} {...handlers} />)}
  </div>
}
