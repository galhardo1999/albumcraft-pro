import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardNavbar } from '@/shared/components/navbar'
import { PhotoService } from '@/features/photos/services/photo.service'
import { PhotosView } from '@/features/photos/components/photos-view'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'
import { Photo } from '@/features/photos/types'

export const dynamic = 'force-dynamic'

export default async function PhotosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect('/auth/login')
  }

  const verification = await JWTConfig.verifyToken(token)
  if (!verification.valid || !verification.payload) {
    redirect('/auth/login')
  }

  const photos = await PhotoService.getPhotosByUserId(verification.payload.userId as string) as unknown as Photo[]

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Fotos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as fotos dos seus projetos
            </p>
          </div>
        </div>

        <PhotosView initialPhotos={photos} />
      </main>
    </div>
  )
}