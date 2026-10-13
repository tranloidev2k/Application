import { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

export function Field({ label, required, error, wide, children }: { label: string; required?: boolean; error?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`field ${wide ? 'wide' : ''} ${error ? 'field-error' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}{error && <em><AlertCircle size={14} />{error}</em>}</label>
}
