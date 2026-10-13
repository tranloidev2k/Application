'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Route } from '../../utils/routes'
import { Application } from '../../types'

type Crumb = { label: string; href?: string }

const PAGE_TITLES: Record<Route['page'], string> = {
  dashboard: 'Tổng quan',
  applications: 'Đơn ứng tuyển',
  detail: 'Đơn ứng tuyển',
  edit: 'Đơn ứng tuyển',
  new: 'Thêm đơn ứng tuyển',
  calendar: 'Lịch công việc',
  account: 'Tài khoản',
}

function crumbsFor(route: Route, application?: Application): Crumb[] {
  if (route.page !== 'detail' && route.page !== 'edit') return [{ label: PAGE_TITLES[route.page] }]
  const crumbs: Crumb[] = [{ label: 'Đơn ứng tuyển', href: '/applications' }]
  // The company name is only known once the application has loaded on the client.
  if (application) crumbs.push({ label: application.companyName, href: route.page === 'edit' ? `/applications/${application.id}` : undefined })
  if (route.page === 'edit') crumbs.push({ label: 'Chỉnh sửa' })
  return crumbs
}

/** Where the user is: a plain title on top-level pages, a short breadcrumb on an application's detail and edit pages. */
export function TopbarTitle({ route, application }: { route: Route; application?: Application }) {
  const crumbs = crumbsFor(route, application)
  return <nav className="topbar-title" aria-label="Vị trí hiện tại">
    <ol>
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1
        return <Fragment key={`${index}-${crumb.label}`}>
          {index > 0 && <li className="topbar-crumb-separator" aria-hidden="true"><ChevronRight size={15} /></li>}
          <li className={`topbar-crumb ${last ? 'current' : ''}`}>
            {crumb.href && !last
              ? <Link href={crumb.href}>{crumb.label}</Link>
              : <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>}
          </li>
        </Fragment>
      })}
    </ol>
  </nav>
}
