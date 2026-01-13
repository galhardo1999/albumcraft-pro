import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import DiagramadorWorkspace from '@/components/diagramador/DiagramadorWorkspace'
import { AlbumService } from '@/features/albums/services/album.service'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'
import { AlbumHeader } from '@/features/albums/components/album-header'

export default async function ProjectDiagramadorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect('/auth/login')
  }

  const verification = await JWTConfig.verifyToken(token)
  if (!verification.valid || !verification.payload) {
    redirect('/auth/login')
  }

  const album = await AlbumService.getAlbumById(resolvedParams.id) as any

  if (!album) {
    notFound()
  }

  if (album.userId !== (verification.payload.userId as string)) {
    notFound()
  }

  return (
    <div className="diagramador-page h-screen bg-background flex flex-col overflow-hidden">
      {/* Header handled by a client component for interactivity */}
      <AlbumHeader album={album} />

      {/* Diagramador Workspace */}
      <DiagramadorWorkspace album={album} />
    </div>
  )
}