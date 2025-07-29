'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProtectedRoute } from '@/hooks/useAuth'

interface PhotoEvent {
  id: string
  name: string
  description?: string
  createdAt: string
  _count: {
    albums: number
  }
}

export default function FotosDisponiveisPage() {
  const { logout } = useProtectedRoute()
  const [events, setEvents] = useState<PhotoEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPhotoEvents()
  }, [])

  const fetchPhotoEvents = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/user/photo-events', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao carregar eventos de fotos')
      }
      
      const data = await response.json()
      setEvents(data.data || [])
      
    } catch (err) {
      setError('Erro ao carregar eventos de fotos')
      console.error('Photo events error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
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
            <span className="text-foreground">Fotos Disponíveis</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Fotos Disponíveis</h1>
          <p className="text-muted-foreground">Eventos de fotos aos quais você tem acesso</p>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <div className="p-4 bg-muted/50 rounded-lg w-fit mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum evento disponível</h3>
            <p className="text-muted-foreground">Você ainda não tem acesso a nenhum evento de fotos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/fotos-disponiveis/${event.id}`}
                className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors truncate">
                      {event.name}
                    </h3>
                    {event.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{event._count.albums} álbum{event._count.albums !== 1 ? 's' : ''}</span>
                      <span>{new Date(event.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                  Ver álbuns
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}