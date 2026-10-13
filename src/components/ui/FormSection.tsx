import { ReactNode } from 'react'

export function FormSection({ number, title, description, children }: { number: string; title: string; description?: string; children: ReactNode }) {
  return <section className="form-section">
    <div className="section-title">
      <span aria-hidden="true">{number}</span>
      <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
    </div>
    <div className="section-fields">{children}</div>
  </section>
}
