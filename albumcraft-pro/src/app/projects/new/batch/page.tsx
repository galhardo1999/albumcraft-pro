'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AlbumData {
  id: string
  name: string
  description: string
  albumSize: string
  template: string
}

export default function BatchAlbumsPage() {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [albums, setAlbums] = useState<AlbumData[]>([
    { id: '1', name: '', description: '', albumSize: 'MEDIUM', template: 'classic' },
    { id: '2', name: '', description: '', albumSize: 'MEDIUM', template: 'classic' },
    { id: '3', name: '', description: '', albumSize: 'MEDIUM', template: 'classic' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const albumSizes = [
    { id: 'SMALL', name: '15x20cm' },
    { id: 'MEDIUM', name: '20x30cm' },
    { id: 'LARGE', name: '30x40cm' },
    { id: 'EXTRA_LARGE', name: '40x50cm' }
  ]

  const templates = [
    { id: 'classic', name: 'Clássico' },
    { id: 'modern', name: 'Moderno' },
    { id: 'artistic', name: 'Artístico' },
    { id: 'minimal', name: 'Minimalista' }
  ]

  const handleAlbumChange = (albumId: string, field: keyof Omit<AlbumData, 'id'>, value: string) => {
    setAlbums(prev => prev.map(album => 
      album.id === albumId ? { ...album, [field]: value } : album
    ))
  }

  const addAlbum = () => {
    const newId = (albums.length + 1).toString()
    setAlbums(prev => [...prev, {
      id: newId,
      name: '',
      description: '',
      albumSize: 'MEDIUM',
      template: 'classic'
    }])
  }

  const removeAlbum = (albumId: string) => {
    if (albums.length > 1) {
      setAlbums(prev => prev.filter(album => album.id !== albumId))
    }
  }

  const applyToAll = (field: keyof Omit<AlbumData, 'id' | 'name' | 'description'>, value: string) => {
    setAlbums(prev => prev.map(album => ({ ...album, [field]: value })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validAlbums = albums.filter(album => album.name.trim())
    
    if (validAlbums.length === 0) {
      setError('Pelo menos um álbum deve ter um nome')
      return
    }

    if (!groupName.trim()) {
      setError('Nome do grupo é obrigatório para criação')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const promises = validAlbums.map(album => 
        fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: album.name.trim(),
            description: album.description.trim(),
            albumSize: album.albumSize,
            template: album.template,
            status: 'DRAFT',
            creationType: 'BATCH',
            group: groupName.trim()
          })
        })
      )

      const responses = await Promise.all(promises)
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        router.push('/projects')
      } else {
        setError('Erro ao criar alguns álbuns. Tente novamente.')
      }
    } catch (error) {
      console.error('Error creating projects:', error)
      setError('Erro ao criar álbuns. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/auth/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>→</span>
            <Link href="/projects/new" className="hover:text-foreground transition-colors">Novo Projeto</Link>
            <span>→</span>
            <span className="text-foreground">Criar Diversos Álbuns</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Criar Diversos Álbuns</h1>
          <p className="text-lg text-muted-foreground">
            Configure múltiplos álbuns de uma só vez para agilizar seu fluxo de trabalho
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Group Configuration */}
        <div className="rounded-xl border bg-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuração do Grupo</h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2">
              Nome do Grupo *
            </label>
            <Input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Evento Escolar, Formatura 2024, Casamento Silva..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Este nome será usado para agrupar todos os álbuns criados nesta sessão
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="rounded-xl border bg-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Aplicar a Todos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tamanho</label>
              <select
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onChange={(e) => applyToAll('albumSize', e.target.value)}
              >
                <option value="">Selecione um tamanho</option>
                {albumSizes.map((size) => (
                  <option key={size.id} value={size.id}>{size.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <select
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onChange={(e) => applyToAll('template', e.target.value)}
              >
                <option value="">Selecione um template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Albums List */}
          <div className="space-y-4">
            {albums.map((album, index) => (
              <div key={album.id} className="rounded-xl border bg-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Álbum {index + 1}</h3>
                  {albums.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlbum(album.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remover
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Nome do Álbum *
                    </label>
                    <Input
                      type="text"
                      value={album.name}
                      onChange={(e) => handleAlbumChange(album.id, 'name', e.target.value)}
                      placeholder={`Ex: Projeto ${index + 1}`}
                      className="w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={album.description}
                      onChange={(e) => handleAlbumChange(album.id, 'description', e.target.value)}
                      placeholder="Descreva brevemente o álbum..."
                      className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tamanho</label>
                    <select
                      value={album.albumSize}
                      onChange={(e) => handleAlbumChange(album.id, 'albumSize', e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      {albumSizes.map((size) => (
                        <option key={size.id} value={size.id}>{size.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Template</label>
                    <select
                      value={album.template}
                      onChange={(e) => handleAlbumChange(album.id, 'template', e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Album Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addAlbum}
              className="w-full max-w-md"
            >
              + Adicionar Outro Álbum
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </Button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {albums.filter(album => album.name.trim()).length} álbum(s) válido(s)
              </span>
              <Button 
                type="submit" 
                disabled={isLoading || albums.filter(album => album.name.trim()).length === 0}
                className="min-w-[140px]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    <span>Criando...</span>
                  </div>
                ) : (
                  'Criar Álbuns'
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}