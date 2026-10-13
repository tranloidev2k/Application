import { ReactNode } from 'react'

export function EmptyMini({ icon, text }: { icon: ReactNode; text: string }) { return <div className="empty-mini"><span>{icon}</span><p>{text}</p></div> }
