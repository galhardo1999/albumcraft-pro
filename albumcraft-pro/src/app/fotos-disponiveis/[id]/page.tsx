'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useProtectedRoute } from '@/hooks/useAuth'

interface PhotoEvent {
  id: string
  name: string
  description?: string
  albums: PhotoAlbum[]
}

interface PhotoAlbum {
  id: string
  name: string
  description?: string
  createdAt: string
  _count: {
    photos: number
  }
  photos: PhotoGalleryItem[]
}

interface PhotoGalleryItem {
  id: string
  filename: string
  url: string
}

export default function EventoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { logout } = useProtectedRoute()
  const { id: eventId } = use(params)
  const [event, setEvent] = useState<PhotoEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/user/photo-events/${eventId}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar evento')
        }

        const data = await response.json()
        setEvent(data.data)
      } catch (err) {
        setError('Erro ao carregar evento')
        console.error('Erro:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handleLogout = async () => {
    await logout()
  }

  const handleDownloadAll = async () => {
    if (!event || isDownloading) return

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/user/photo-events/${eventId}/download`, {
        credentials: 'include'
      })

      if (!response.ok) {
        // Tentar obter detalhes do erro da resposta
        let errorMessage = 'Erro ao baixar fotos'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Criar blob e fazer download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event.name}_fotos.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao baixar fotos'
      setError(errorMessage)
      console.error('Erro no download:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Evento não encontrado</h2>
          <p className="text-muted-foreground mb-4">O evento solicitado não existe ou você não tem acesso a ele.</p>
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
            <span className="text-foreground">{event.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">{event.name}</h1>
              {event.description && (
                <p className="text-muted-foreground">{event.description}</p>
              )}
            </div>
            
            {/* Botão de Download */}
            {event.albums.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    Baixando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Baixar Todas as Fotos
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Albums Grid */}
        {event.albums.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <div className="p-4 bg-muted/50 rounded-lg w-fit mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum álbum disponível</h3>
            <p className="text-muted-foreground">Este evento ainda não possui álbuns de fotos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {event.albums.map((album) => (
              <Link
                key={album.id}
                href={`/fotos-disponiveis/${eventId}/albums/${album.id}`}
                className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group"
              >
                {/* Preview das fotos */}
                <div className="relative h-48 overflow-hidden rounded-t-xl bg-gray-100">
                  {album.photos.length > 0 ? (
                    <div className="grid h-full">
                      {album.photos.length === 1 ? (
                        // Uma foto - ocupa todo o espaço
                        <div className="relative h-full">
                          <img
                            src={album.photos[0].url}
                            alt={album.photos[0].filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : album.photos.length === 2 ? (
                        // Duas fotos - lado a lado
                        <div className="grid grid-cols-2 gap-1 h-full">
                          {album.photos.map((photo, index) => (
                            <div key={photo.id} className="relative">
                              <img
                                src={photo.url}
                                alt={photo.filename}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Três ou mais fotos - layout especial
                        <div className="grid grid-cols-2 gap-1 h-full">
                          {/* Primeira foto ocupa toda a altura à esquerda */}
                          <div className="relative">
                            <img
                              src={album.photos[0].url}
                              alt={album.photos[0].filename}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          {/* Duas fotos menores à direita */}
                          <div className="grid grid-rows-2 gap-1">
                            <div className="relative">
                              <img
                                src={album.photos[1].url}
                                alt={album.photos[1].filename}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="relative">
                              <img
                                src={album.photos[2].url}
                                alt={album.photos[2].filename}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {/* Overlay com contador se houver mais fotos */}
                              {album._count.photos > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white font-semibold text-lg">
                                    +{album._count.photos - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Placeholder quando não há fotos
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">Sem fotos</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conteúdo do card */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {album.name}
                  </h3>
                  {album.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {album.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{album._count.photos} foto{album._count.photos !== 1 ? 's' : ''}</span>
                    <span>{new Date(album.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center justify-center text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                    Ver fotos
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}