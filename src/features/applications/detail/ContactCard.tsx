import { Mail, UserRound } from 'lucide-react'
import { Application } from '../../../types'

export function ContactCard({ application }: { application: Application }) {
  const { contactName, contactEmail } = application
  return <section className="panel contact-card">
    <h3>Liên hệ</h3>
    {contactName || contactEmail ? <>
      <div className="contact-person"><span aria-hidden="true"><UserRound size={19} /></span><div><strong>{contactName || 'Nhà tuyển dụng'}</strong></div></div>
      {contactEmail && <a href={`mailto:${contactEmail}`}><Mail size={15} aria-hidden="true" />{contactEmail}</a>}
    </> : <p>Chưa có thông tin người liên hệ.</p>}
  </section>
}
