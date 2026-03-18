import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FullOnboarding from '@/components/FullOnboarding'

export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')
  return <FullOnboarding />
}
