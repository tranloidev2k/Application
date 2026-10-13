'use client'

import { ReactNode } from 'react'
import { Plus } from 'lucide-react'

export function EmptyTab({ icon, title, text, action, onAction }: { icon: ReactNode; title: string; text: string; action: string; onAction: () => void }) { return <div className="empty-tab"><span>{icon}</span><h3>{title}</h3><p>{text}</p><button className="secondary" onClick={onAction}><Plus size={16} />{action}</button></div> }
