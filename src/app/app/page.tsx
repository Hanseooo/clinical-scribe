import type { Metadata } from 'next'
import { AppClient } from './app-client'

export const metadata: Metadata = {
  title: 'App',
  description: 'Create structured clinical handover documents.',
}

export default function AppPage() {
  return <AppClient />
}
