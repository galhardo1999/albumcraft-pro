'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

import { ALBUM_SIZES, formatSizeDisplay, AlbumSizeConfig } from '@/lib/album-sizes'

interface FormData {
  name: string
  albumSize: string
}

// Nova interface para fotos temporárias (apenas em memória)
interface TempPhoto {
  id: string
  file: File
  name: string
  url: string // URL temporária criada com URL.createObjectURL
  width: number
  height: number
  fileSize: number
  isTemp: true
}

// Interface unificada para fotos (apenas temporárias agora)
type PhotoItem = TempPhoto

export default function SingleAlbumPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    albumSize: 'SIZE_30X20' // Padrão para 30x20
  })
  const [photos, setPhotos] = useState<PhotoItem[]>([]) // Agora suporta apenas fotos temporárias
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obter apenas os tamanhos específicos solicitados
  const getAlbumSizes = (): AlbumSizeConfig[] => {
    return ALBUM_SIZES.filter(size => 
      size.id === 'SIZE_30X20' || size.id === 'SIZE_20X30'
    )
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Função para remover foto da lista
  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId)
      
      // Se for uma foto temporária, limpar a URL para evitar memory leak
      if (photoToRemove && photoToRemove.isTemp) {
        URL.revokeObjectURL(photoToRemove.url)
      }
      
      return prev.filter(p => p.id !== photoId)
    })
  }

  // Cleanup das URLs temporárias quando o componente for desmontado
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.isTemp) {
          URL.revokeObjectURL(photo.url)
        }
      })
    }
  }, [photos])

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      const tempPhotos: TempPhoto[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          console.warn(`Arquivo ${file.name} não é uma imagem válida`)
          continue
        }
        
        // Criar URL temporária para preview
        const tempUrl = URL.createObjectURL(file)
        
        // Obter dimensões da imagem
        const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
          if (typeof window !== 'undefined') {
            const img = new window.Image()
            img.onload = () => {
              resolve({ width: img.naturalWidth, height: img.naturalHeight })
            }
            img.onerror = () => {
              resolve({ width: 0, height: 0 })
            }
            img.src = tempUrl
          } else {
            // No servidor, não podemos obter dimensões, usar valores padrão
            resolve({ width: 0, height: 0 })
          }
        })
        
        // Gerar ID único para a foto temporária
        const tempId = `temp_${Date.now()}_${i}`
        
        // Criar objeto de foto temporária
        const tempPhoto: TempPhoto = {
          id: tempId,
          file: file,
          name: file.name,
          url: tempUrl,
          width: dimensions.width,
          height: dimensions.height,
          fileSize: file.size,
          isTemp: true
        }
        
        tempPhotos.push(tempPhoto)
      }
      
      // Adicionar fotos temporárias ao estado
      setPhotos(prev => [...prev, ...tempPhotos])
      setError('')
      
      // Limpar o input
      event.target.value = ''
      
    } catch (error) {
      console.error('Erro ao processar fotos:', error)
      setError('Erro ao processar fotos. Tente novamente.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      // 1. Criar o projeto
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          albumSize: formData.albumSize,
          status: 'DRAFT',
          creationType: 'SINGLE'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao criar álbum')
        return
      }

      const data = await response.json()
      const projectId = data.project.id

      // 2. Fazer upload das fotos temporárias
      if (photos.length > 0) {
        try {
          const uploadPromises: Promise<Response>[] = []

          for (const photo of photos) {
            // Fazer upload da foto temporária
            const formData = new FormData()
            formData.append('files', photo.file)
            formData.append('projectId', projectId) // Associar diretamente ao projeto

            const uploadPromise = fetch('/api/photos', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            })

            uploadPromises.push(uploadPromise)
          }

          // Executar todos os uploads em paralelo
          const results = await Promise.allSettled(uploadPromises)
          
          // Verificar resultados e capturar erros
          const errors: string[] = []
          for (let i = 0; i < results.length; i++) {
            const result = results[i]
            if (result.status === 'rejected') {
              console.error(`Erro no upload ${i}:`, result.reason)
              errors.push(`Erro no upload da foto ${i + 1}`)
            } else {
              // Verificar se a resposta foi bem-sucedida
              const response = result.value
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
                console.error(`Erro HTTP no upload ${i}:`, response.status, errorData)
                errors.push(`Erro HTTP ${response.status} na foto ${i + 1}: ${errorData.error || 'Erro desconhecido'}`)
              }
            }
          }
          
          if (errors.length > 0) {
            console.error('Erros encontrados nos uploads:', errors)
            setError(`Álbum criado, mas houve erros: ${errors.join(', ')}`)
          }

          // Limpar URLs temporárias para evitar memory leaks
          photos.forEach(photo => {
            if (photo.isTemp) {
              URL.revokeObjectURL(photo.url)
            }
          })

        } catch (photoError) {
          console.error('Erro ao processar fotos:', photoError)
          // Não bloquear a criação do projeto por erro nas fotos
          setError('Álbum criado, mas houve erro ao processar algumas fotos.')
        }
      }

      // 3. Redirecionar para o projeto criado
      router.push(`/projects/${projectId}`)
      
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
            
            <div className="space-y-6">
              {/* Nome do Álbum */}
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

              {/* Tamanho do Álbum */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  Tamanho do Álbum *
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getAlbumSizes().map((size) => (
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
                        <div className="flex-1">
                          <h3 className="font-semibold">{size.displayName}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload de Fotos */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  Upload de Fotos
                </label>
                
                <p className="text-xs text-muted-foreground mb-4">
                  Formatos aceitos: JPG, PNG. As fotos serão salvas quando você criar o álbum.
                </p>

                {/* Lista de Fotos Carregadas */}
                {photos.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">
                        Fotos Carregadas ({photos.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square bg-background border rounded-lg overflow-hidden">
                            <Image
                              src={photo.url}
                              alt={photo.name}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Botão de remoção */}
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remover foto"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-1">
                            <p className="text-xs font-medium truncate" title={photo.name}>
                              {photo.name}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">
                                {photo.width}×{photo.height}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(photo.fileSize)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado vazio - Área clicável */}
                {photos.length === 0 && (
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                    onClick={handleImportClick}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Nenhuma foto selecionada
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clique aqui para adicionar imagens ao seu álbum
                    </p>
                  </div>
                )}
              </div>
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

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </main>
    </div>
  )
}