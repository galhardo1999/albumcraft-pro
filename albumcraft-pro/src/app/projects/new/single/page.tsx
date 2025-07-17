'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

import { ALBUM_SIZES, getPopularSizes, getSizesByCategory, formatSizeDisplay, AlbumSizeConfig } from '@/lib/album-sizes'

interface FormData {
  name: string
  albumSize: string
}

interface Photo {
  id: string
  url: string
  name: string
  width: number
  height: number
  fileSize: number
  projectId?: string | null // Incluir projectId
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

// Interface unificada para fotos (persistidas ou temporárias)
type PhotoItem = Photo | TempPhoto

export default function SingleAlbumPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    albumSize: 'SIZE_20X20' // Padrão para formato quadrado popular
  })
  const [photos, setPhotos] = useState<PhotoItem[]>([]) // Agora suporta fotos temporárias
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([])
  const [selectedExistingPhotos, setSelectedExistingPhotos] = useState<Set<string>>(new Set())
  const [showExistingPhotos, setShowExistingPhotos] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<'popular' | 'square' | 'landscape' | 'portrait'>('popular')

  // Obter tamanhos baseado na categoria selecionada
  const getAlbumSizes = (): AlbumSizeConfig[] => {
    switch (selectedCategory) {
      case 'popular':
        return getPopularSizes()
      case 'square':
        return getSizesByCategory('square')
      case 'landscape':
        return getSizesByCategory('landscape')
      case 'portrait':
        return getSizesByCategory('portrait')
      default:
        return getPopularSizes()
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Carregar fotos existentes do usuário (sem projectId para pegar todas)
  const loadExistingPhotos = async () => {
    try {
      setIsLoadingExisting(true)
      const response = await fetch('/api/photos')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar fotos existentes')
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Filtrar apenas fotos que não estão associadas a nenhum projeto
        const unassignedPhotos = result.data.filter((photo: Photo) => !photo.projectId)
        setExistingPhotos(unassignedPhotos)
      }
    } catch (error) {
      console.error('Erro ao carregar fotos existentes:', error)
    } finally {
      setIsLoadingExisting(false)
    }
  }

  // Carregar fotos existentes quando o componente montar
  useEffect(() => {
    loadExistingPhotos()
  }, [])

  const toggleExistingPhoto = (photoId: string) => {
    setSelectedExistingPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  // Função para remover foto da lista
  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId)
      
      // Se for uma foto temporária, limpar a URL para evitar memory leak
      if (photoToRemove && 'isTemp' in photoToRemove && photoToRemove.isTemp) {
        URL.revokeObjectURL(photoToRemove.url)
      }
      
      return prev.filter(p => p.id !== photoId)
    })
  }

  // Cleanup das URLs temporárias quando o componente for desmontado
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if ('isTemp' in photo && photo.isTemp) {
          URL.revokeObjectURL(photo.url)
        }
      })
    }
  }, [photos])

  const addSelectedPhotosToAlbum = () => {
    const selectedPhotos = existingPhotos.filter(photo => 
      selectedExistingPhotos.has(photo.id)
    )
    setPhotos(prev => [...prev, ...selectedPhotos])
    setSelectedExistingPhotos(new Set())
    setShowExistingPhotos(false)
  }

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

      // 2. Fazer upload das fotos temporárias e associar fotos existentes ao projeto
      if (photos.length > 0) {
        try {
          const uploadPromises: Promise<Response>[] = []

          for (const photo of photos) {
            if ('isTemp' in photo && photo.isTemp) {
              // É uma foto temporária - fazer upload
              const formData = new FormData()
              formData.append('files', photo.file)
              formData.append('projectId', projectId) // Associar diretamente ao projeto

              const uploadPromise = fetch('/api/photos', {
                method: 'POST',
                body: formData,
                credentials: 'include'
              })

              uploadPromises.push(uploadPromise)
            } else {
              // É uma foto existente - apenas associar ao projeto
              const updatePromise = fetch(`/api/photos/${photo.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  projectId: projectId
                })
              })

              uploadPromises.push(updatePromise)
            }
          }

          // Executar todos os uploads/updates em paralelo
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
            if ('isTemp' in photo && photo.isTemp) {
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
                
                {/* Categorias de Tamanho */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'popular', label: 'Populares' },
                      { key: 'square', label: 'Quadrados' },
                      { key: 'landscape', label: 'Paisagem' },
                      { key: 'portrait', label: 'Retrato' }
                    ].map((category) => (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => setSelectedCategory(category.key as any)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          selectedCategory === category.key
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
                
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
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{formatSizeDisplay(size)}</h3>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {size.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{size.description}</p>
                          {size.isPopular && (
                            <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
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
                
                {/* Botões de Upload */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleImportClick}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Fazer Upload
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowExistingPhotos(true)}
                    disabled={isLoadingExisting}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {isLoadingExisting ? 'Carregando...' : `Fotos Existentes (${existingPhotos.length})`}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Formatos aceitos: JPG, PNG. As fotos marcadas como &quot;Temp&quot; serão salvas apenas quando você criar o álbum.
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
                            
                            {/* Indicador de status */}
                            <div className="absolute top-1 left-1">
                              {'isTemp' in photo && photo.isTemp ? (
                                <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                  Temp
                                </span>
                              ) : (
                                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                  Salva
                                </span>
                              )}
                            </div>
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

                {/* Estado vazio */}
                {photos.length === 0 && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Nenhuma foto selecionada
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clique em &quot;Fazer Upload&quot; ou &quot;Fotos Existentes&quot; para adicionar imagens ao seu álbum
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

        {/* Modal de Fotos Existentes */}
        {showExistingPhotos && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Selecionar Fotos Existentes</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowExistingPhotos(false)
                      setSelectedExistingPhotos(new Set())
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecione fotos que não estão associadas a nenhum projeto para adicionar ao seu álbum.
                </p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {existingPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {existingPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedExistingPhotos.has(photo.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleExistingPhoto(photo.id)}
                      >
                        <div className="aspect-square">
                          <Image
                            src={photo.url}
                            alt={photo.name}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Checkbox overlay */}
                        <div className="absolute top-2 right-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedExistingPhotos.has(photo.id)
                              ? 'bg-primary border-primary'
                              : 'bg-background border-border'
                          }`}>
                            {selectedExistingPhotos.has(photo.id) && (
                              <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                          <p className="text-xs font-medium truncate" title={photo.name}>
                            {photo.name}
                          </p>
                          <div className="flex justify-between items-center text-xs opacity-75">
                            <span>{photo.width}×{photo.height}</span>
                            <span>{formatFileSize(photo.fileSize)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground">
                      Nenhuma foto disponível para seleção
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Todas as suas fotos já estão associadas a projetos ou você ainda não fez upload de nenhuma foto.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedExistingPhotos.size} foto(s) selecionada(s)
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowExistingPhotos(false)
                        setSelectedExistingPhotos(new Set())
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={addSelectedPhotosToAlbum}
                      disabled={selectedExistingPhotos.size === 0}
                    >
                      Adicionar {selectedExistingPhotos.size > 0 ? `(${selectedExistingPhotos.size})` : ''}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}