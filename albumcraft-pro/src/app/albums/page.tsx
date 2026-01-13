import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AlbumService } from '@/features/albums/services/album.service'
import { AlbumList } from '@/features/albums/components/album-list'
import { DashboardNavbar } from '@/shared/components/navbar'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'
import { Album } from '@/features/albums/types'

export const dynamic = 'force-dynamic'

export default async function AlbumsPage() {
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
  const albums = await AlbumService.getUserAlbums(userId) as unknown as Album[]

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AlbumList initialAlbums={albums} />
      </main>
    </div>
  )
}