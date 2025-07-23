'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import { ALBUM_SIZES, getPopularSizes, getSizesByCategory, formatSizeDisplay, AlbumSizeConfig } from '@/lib/album-sizes'
import Image from 'next/image'

interface User {
  id: string
  email: string
  name: string
}

interface Photo {
  id: string
  url: string
  name: string
  width: number
  height: number
  fileSize: number
  projectId?: string | null
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

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: () => void
}

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    albumSize: 'SIZE_20X20',
    status: 'DRAFT',
    creationType: 'SINGLE'
  })
  const [users, setUsers] = useState<User[]>([])
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([])
  const [selectedExistingPhotos, setSelectedExistingPhotos] = useState<Set<string>>(new Set())
  const [showExistingPhotos, setShowExistingPhotos] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'popular' | 'square' | 'landscape' | 'portrait'>('popular')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Carregar usuários
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Carregar fotos existentes do usuário selecionado
  const loadExistingPhotos = async (userId: string) => {
    if (!userId) return
    
    try {
      setIsLoadingExisting(true)
      const response = await fetch(`/api/admin/users/${userId}/photos`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
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

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.userId) {
      loadExistingPhotos(formData.userId)
    }
  }, [formData.userId])

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const addSelectedPhotosToAlbum = () => {
    const selectedPhotos = existingPhotos.filter(photo => 
      selectedExistingPhotos.has(photo.id)
    )
    setPhotos(prev => [...prev, ...selectedPhotos])
    setSelectedExistingPhotos(new Set())
    setShowExistingPhotos(false)
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
    
    if (!formData.userId || !formData.name.trim()) {
      setError('Usuário e nome do projeto são obrigatórios')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 1. Criar o projeto
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: formData.userId,
          name: formData.name.trim(),
          albumSize: formData.albumSize,
          status: formData.status,
          creationType: formData.creationType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao criar projeto')
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
              const formDataUpload = new FormData()
              formDataUpload.append('files', photo.file)
              formDataUpload.append('projectId', projectId)
              formDataUpload.append('userId', formData.userId) // Adicionar userId para upload admin

              const uploadPromise = fetch('/api/admin/photos', {
                method: 'POST',
                body: formDataUpload,
                credentials: 'include'
              })

              uploadPromises.push(uploadPromise)
            } else {
              // É uma foto existente - apenas associar ao projeto
              const updatePromise = fetch(`/api/admin/photos/${photo.id}`, {
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
            setError(`Projeto criado, mas houve erros: ${errors.join(', ')}`)
          }

          // Limpar URLs temporárias para evitar memory leaks
          photos.forEach(photo => {
            if ('isTemp' in photo && photo.isTemp) {
              URL.revokeObjectURL(photo.url)
            }
          })

        } catch (photoError) {
          console.error('Erro ao processar fotos:', photoError)
          setError('Projeto criado, mas houve erro ao processar algumas fotos.')
        }
      }

      // 3. Resetar formulário e fechar modal
      setFormData({
        userId: '',
        name: '',
        albumSize: 'SIZE_20X20',
        status: 'DRAFT',
        creationType: 'SINGLE'
      })
      setPhotos([])
      setExistingPhotos([])
      setSelectedExistingPhotos(new Set())
      setShowExistingPhotos(false)
      onProjectCreated()
      onClose()
      
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Erro ao criar projeto. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Criar Novo Projeto</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Usuário */}
            <div>
              <Label htmlFor="userId">Usuário</Label>
              <Select value={formData.userId} onValueChange={(value) => handleInputChange('userId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsers ? "Carregando usuários..." : "Selecione um usuário"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome do Projeto */}
            <div>
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do projeto"
                required
              />
            </div>

            {/* Tamanho do Álbum */}
            <div>
              <Label>Tamanho do Álbum</Label>
              
              {/* Categorias */}
              <div className="flex gap-2 mb-4 mt-2">
                {[
                  { key: 'popular', label: '⭐ Popular' },
                  { key: 'square', label: '⬜ Quadrado' },
                  { key: 'landscape', label: '📐 Paisagem' },
                  { key: 'portrait', label: '📱 Retrato' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key as any)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Grid de Tamanhos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getAlbumSizes().map((size) => (
                  <div
                    key={size.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.albumSize === size.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('albumSize', size.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{formatSizeDisplay(size)}</h4>
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
              <Label>Fotos do Projeto</Label>
              
              <div className="mt-2 space-y-4">
                {/* Botões de Upload */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleImportClick}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Importar Fotos
                  </Button>
                  
                  {formData.userId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowExistingPhotos(true)}
                      className="flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Fotos Existentes ({existingPhotos.length})
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: JPG, PNG. As fotos marcadas como "Temp" serão salvas apenas quando você criar o projeto.
                </p>

                {/* Lista de Fotos Carregadas */}
                {photos.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">
                        Fotos Carregadas ({photos.length})
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          photos.forEach(photo => {
                            if ('isTemp' in photo && photo.isTemp) {
                              URL.revokeObjectURL(photo.url)
                            }
                          })
                          setPhotos([])
                        }}
                      >
                        Limpar Todas
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={photo.url}
                              alt={photo.name}
                              width={150}
                              height={150}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          
                          <div className="mt-1 text-xs text-center">
                            <p className="truncate" title={photo.name}>
                              {photo.name}
                              {'isTemp' in photo && photo.isTemp && (
                                <span className="text-orange-600 ml-1">(Temp)</span>
                              )}
                            </p>
                            <p className="text-muted-foreground">
                              {formatFileSize(photo.fileSize)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Criação */}
            <div>
              <Label htmlFor="creationType">Tipo de Criação</Label>
              <Select value={formData.creationType} onValueChange={(value) => handleInputChange('creationType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Álbum Único</SelectItem>
                  <SelectItem value="BATCH">Múltiplos Álbuns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Modal de Fotos Existentes */}
      {showExistingPhotos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Fotos Existentes do Usuário ({existingPhotos.length})
                </h3>
                <button
                  onClick={() => setShowExistingPhotos(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isLoadingExisting ? (
                <div className="text-center py-8">
                  <p>Carregando fotos...</p>
                </div>
              ) : existingPhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma foto disponível para este usuário</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                    {existingPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedExistingPhotos.has(photo.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleExistingPhoto(photo.id)}
                      >
                        <div className="aspect-square">
                          <Image
                            src={photo.url}
                            alt={photo.name}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {selectedExistingPhotos.has(photo.id) && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-blue-500 text-white rounded-full p-1">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {selectedExistingPhotos.size} foto(s) selecionada(s)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowExistingPhotos(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={addSelectedPhotosToAlbum}
                        disabled={selectedExistingPhotos.size === 0}
                      >
                        Adicionar Selecionadas
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}