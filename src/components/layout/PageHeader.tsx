import { ReactNode } from 'react'

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1></div>{action}</div>
}
