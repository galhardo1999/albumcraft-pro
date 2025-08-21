'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import DiagramadorWorkspace from '@/components/diagramador/DiagramadorWorkspace'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Album } from '@/types/album'

export default function ProjectDiagramadorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { logout } = useAuth()
  const [album, setAlbum] = useState<Album | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAlbum = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/albums/${resolvedParams.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setAlbum(data.data)
      } else {
        setError('Álbum não encontrado')
      }
    } catch (err) {
      setError('Erro ao carregar álbum')
      console.error('Error fetching album:', err)
    } finally {
      setIsLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    if (resolvedParams.id) {
      fetchAlbum()
    }
  }, [resolvedParams.id, fetchAlbum])

 // Prevenir scroll na página do diagramador
  useEffect(() => {
    // Adicionar classe ao body para prevenir scroll
    document.body.style.overflow = 'hidden'
    
    // Cleanup: restaurar scroll quando sair da página
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando álbum...</p>
        </div>
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erro</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/albums" className="inline-flex items-center text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Álbuns
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="diagramador-page h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/albums')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{album.name}</h1>
              <p className="text-sm text-muted-foreground">
                {album.description || 'Diagramador de Álbum'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Diagramador Workspace */}
      <DiagramadorWorkspace album={album} />
    </div>
  )
}