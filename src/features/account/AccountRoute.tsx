'use client'

import { useAppData } from '../../context/AppDataContext'
import { AccountPage } from './AccountPage'

export function AccountRoute() {
  return <AccountPage syncState={useAppData().syncState} />
}
