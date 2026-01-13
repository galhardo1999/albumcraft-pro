import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardNavbar } from '@/shared/components/navbar'
import { DashboardService } from '@/features/dashboard/services/dashboard.service'
import { DashboardView } from '@/features/dashboard/components/dashboard-view'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect('/auth/login')
  }

  const verification = await JWTConfig.verifyToken(token)
  if (!verification.valid || !verification.payload) {
    redirect('/auth/login')
  }

  const userId = verification.payload.userId as string

  const stats = await DashboardService.getStats(userId)
  const userPhotoEvents = await DashboardService.getUserPhotoEvents(userId)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <DashboardView stats={stats} userPhotoEvents={userPhotoEvents} />
      </main>
    </div>
  )
}