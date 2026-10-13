import { ReactNode } from 'react'

export function FormSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <section className="form-section"><div className="section-title"><span>{number}</span><h2>{title}</h2></div><div className="section-fields">{children}</div></section>
}
