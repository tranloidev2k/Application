export type Route = { page: 'dashboard' | 'applications' | 'calendar' | 'new' | 'detail' | 'edit' | 'account'; id?: string }

export function routeFromPathname(pathname: string): Route {
  const path = pathname.replace(/\/$/, '') || '/'
  if (path === '/applications/new') return { page: 'new' }
  if (path === '/calendar') return { page: 'calendar' }
  const detail = path.match(/^\/applications\/([^/]+)$/)
  const edit = path.match(/^\/applications\/([^/]+)\/edit$/)
  if (edit) return { page: 'edit', id: edit[1] }
  if (detail) return { page: 'detail', id: detail[1] }
  if (path === '/applications') return { page: 'applications' }
  if (path === '/account') return { page: 'account' }
  return { page: 'dashboard' }
}
