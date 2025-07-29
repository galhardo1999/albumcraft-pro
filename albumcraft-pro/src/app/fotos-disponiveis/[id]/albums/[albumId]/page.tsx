'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useProtectedRoute } from '@/hooks/useAuth'

interface PhotoAlbum {
  id: string
  name: string
  description?: string
  event: {
    id: string
    name: string
  }
  photos: Photo[]
}

interface Photo {
  id: string
  filename: string
  url: string
  s3Key: string
  uploadedAt: string
}

export default function AlbumDetalhePage({ params }: { params: Promise<{ id: string; albumId: string }> }) {
  const { logout } = useProtectedRoute()
  const { id: eventId, albumId } = use(params)
  const [album, setAlbum] = useState<PhotoAlbum | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(`/api/user/photo-events/${eventId}/albums/${albumId}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar álbum')
        }

        const data = await response.json()
        setAlbum(data.data)
      } catch (err) {
        setError('Erro ao carregar álbum')
        console.error('Erro:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlbum()
  }, [eventId, albumId])

  const handleLogout = async () => {
    await logout()
  }

  const openPhotoModal = (photo: Photo) => {
    setSelectedPhoto(photo)
  }

  const closePhotoModal = () => {
    setSelectedPhoto(null)
  }

  const downloadPhoto = (photo: Photo) => {
    const link = document.createElement('a')
    link.href = photo.url
    link.download = photo.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Álbum não encontrado</h2>
          <p className="text-muted-foreground mb-4">O álbum solicitado não existe ou você não tem acesso a ele.</p>
          <Link
            href="/fotos-disponiveis"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voltar aos eventos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-xl font-semibold tracking-tight">AlbumCraft Pro</h1>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/projects" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Meus Álbuns
              </Link>
              <Link 
                href="/fotos-disponiveis" 
                className="text-sm font-medium text-primary"
              >
                Fotos Disponíveis
              </Link>
              <Link 
                href="/profile" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Link 
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link 
              href="/fotos-disponiveis"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Fotos Disponíveis
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link 
              href={`/fotos-disponiveis/${eventId}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {album.event.name}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{album.name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">{album.name}</h1>
          {album.description && (
            <p className="text-muted-foreground mb-4">{album.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{album.photos.length} foto{album.photos.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>Evento: {album.event.name}</span>
          </div>
        </div>

        {/* Photos Grid */}
        {album.photos.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <div className="p-4 bg-muted/50 rounded-lg w-fit mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma foto disponível</h3>
            <p className="text-muted-foreground">Este álbum ainda não possui fotos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {album.photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                onClick={() => openPhotoModal(photo)}
              >
                <Image
                  src={photo.url}
                  alt={photo.filename}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePhotoModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.filename}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedPhoto.filename}</p>
                    <p className="text-sm text-gray-300">
                      {new Date(selectedPhoto.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadPhoto(selectedPhoto)}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}