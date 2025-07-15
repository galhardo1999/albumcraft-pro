'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FormData {
  name: string
  description: string
  albumSize: string
  template: string
}

export default function SingleAlbumPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    albumSize: 'MEDIUM',
    template: 'classic'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const albumSizes = [
    { id: 'SMALL', name: '15x20cm', description: 'Ideal para álbuns pessoais' },
    { id: 'MEDIUM', name: '20x30cm', description: 'Tamanho padrão mais popular' },
    { id: 'LARGE', name: '30x40cm', description: 'Perfeito para apresentações' },
    { id: 'EXTRA_LARGE', name: '40x50cm', description: 'Formato profissional' }
  ]

  const templates = [
    { id: 'classic', name: 'Clássico', description: 'Layout tradicional e elegante' },
    { id: 'modern', name: 'Moderno', description: 'Design contemporâneo e limpo' },
    { id: 'artistic', name: 'Artístico', description: 'Estilo criativo e único' },
    { id: 'minimal', name: 'Minimalista', description: 'Foco nas imagens' }
  ]

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Nome do álbum é obrigatório')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          albumSize: formData.albumSize,
          template: formData.template,
          status: 'DRAFT'
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/projects/${data.project.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao criar álbum')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Erro ao criar álbum. Tente novamente.')
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>→</span>
            <Link href="/projects/new" className="hover:text-foreground transition-colors">Novo Projeto</Link>
            <span>→</span>
            <span className="text-foreground">Criar Álbum</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Criar Novo Álbum</h1>
          <p className="text-lg text-muted-foreground">
            Configure as especificações do seu álbum individual
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold mb-6">Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome do Álbum *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Casamento João e Maria"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva brevemente o álbum..."
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>
          </div>

          {/* Album Size */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold mb-6">Tamanho do Álbum</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {albumSizes.map((size) => (
                <div
                  key={size.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                    formData.albumSize === size.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleInputChange('albumSize', size.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.albumSize === size.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {formData.albumSize === size.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{size.name}</h3>
                      <p className="text-sm text-muted-foreground">{size.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold mb-6">Escolha um Template</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                    formData.template === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleInputChange('template', template.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.template === template.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {formData.template === template.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim()}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  <span>Criando...</span>
                </div>
              ) : (
                'Criar Álbum'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}