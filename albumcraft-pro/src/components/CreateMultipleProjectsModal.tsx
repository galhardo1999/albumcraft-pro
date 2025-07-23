'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { X, Trash2, FolderOpen } from 'lucide-react'
import { ALBUM_SIZES, getPopularSizes, getSizesByCategory, formatSizeDisplay, AlbumSizeConfig } from '@/lib/album-sizes'
import NextImage from 'next/image'

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

interface CreateMultipleProjectsModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectsCreated: () => void
}

interface FolderStructure {
  [folderName: string]: PhotoItem[]
}

export default function CreateMultipleProjectsModal({ isOpen, onClose, onProjectsCreated }: CreateMultipleProjectsModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
    projectNamePrefix: '',
    albumSize: 'SIZE_20X20',
    status: 'DRAFT'
  })
  const [users, setUsers] = useState<User[]>([])
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'popular' | 'square' | 'landscape' | 'portrait'>('popular')
  const [folders, setFolders] = useState<FileList | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

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

  // Função para organizar fotos em estrutura de pastas
  const getFolderStructure = (photos: PhotoItem[]): FolderStructure => {
    const structure: FolderStructure = {}
    
    photos.forEach(photo => {
      // Extrair nome da pasta do nome do arquivo
      const pathParts = photo.name.split('/')
      let folderName = 'Sem Pasta'
      
      if (pathParts.length > 1) {
        // Se há uma barra no nome, usar a primeira parte como pasta
        folderName = pathParts[0]
      } else {
        // Tentar extrair pasta do nome do arquivo usando padrões comuns
        const fileName = photo.name
        
        // Padrões como "Pasta1_foto.jpg" ou "Album1-foto.jpg"
        const patterns = [
          /^([^_-]+)[_-]/,  // Pasta1_foto.jpg ou Pasta1-foto.jpg
          /^(\d+)/,         // 001foto.jpg -> pasta "1"
          /^([A-Za-z]+)/    // Albumfoto.jpg -> pasta "Album"
        ]
        
        for (const pattern of patterns) {
          const match = fileName.match(pattern)
          if (match) {
            folderName = match[1]
            break
          }
        }
      }
      
      if (!structure[folderName]) {
        structure[folderName] = []
      }
      structure[folderName].push(photo)
    })
    
    return structure
  }

  // Função para obter estrutura de pastas do webkitdirectory
  const getFolderStructureFromFiles = (): Map<string, File[]> => {
    const folderStructure = new Map<string, File[]>()
    
    if (!folders) return folderStructure
    
    for (let i = 0; i < folders.length; i++) {
      const file = folders[i]
      const pathParts = file.webkitRelativePath.split('/')
      
      if (pathParts.length >= 2 && file.type.startsWith('image/')) {
        const folderName = pathParts[1] // Segunda parte é o nome da subpasta
        
        if (!folderStructure.has(folderName)) {
          folderStructure.set(folderName, [])
        }
        folderStructure.get(folderName)?.push(file)
      }
    }
    
    return folderStructure
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

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  // Atualizar estrutura de pastas quando fotos mudarem
  useEffect(() => {
    setFolderStructure(getFolderStructure(photos))
  }, [photos])

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

  // Função para lidar com upload de pastas
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setFolders(files)
    console.log('Arquivos de pasta selecionados:', files.length)

    // Processar estrutura de pastas usando webkitRelativePath
    const folderMap = new Map<string, File[]>()
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (file.type.startsWith('image/')) {
        const pathParts = file.webkitRelativePath.split('/')
        
        if (pathParts.length >= 2) {
          const folderName = pathParts[1] // Segunda parte é o nome da subpasta
          
          if (!folderMap.has(folderName)) {
            folderMap.set(folderName, [])
          }
          folderMap.get(folderName)?.push(file)
        }
      }
    }

    // Converter arquivos para PhotoItem[] organizados por pasta
    const newPhotos: PhotoItem[] = []
    const newFolderStructure: FolderStructure = {}
    
    for (const [folderName, folderFiles] of folderMap.entries()) {
      newFolderStructure[folderName] = []
      
      for (let i = 0; i < folderFiles.length; i++) {
        const file = folderFiles[i]
        
        try {
          const url = URL.createObjectURL(file)
          const img = new Image()
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('Erro ao carregar imagem'))
            img.src = url
          })

          const photoItem: PhotoItem = {
            id: `temp-${Date.now()}-${i}-${folderName}`,
            file: file, // Adicionar referência ao arquivo original
            name: `${folderName}/${file.name}`, // Manter estrutura de pasta no nome
            url,
            width: img.width,
            height: img.height,
            fileSize: file.size,
            isTemp: true
          }

          newPhotos.push(photoItem)
          newFolderStructure[folderName].push(photoItem)
        } catch (error) {
          console.error('Erro ao processar arquivo:', file.name, error)
        }
      }
    }

    setPhotos(newPhotos)
    setFolderStructure(newFolderStructure)
    console.log('Fotos processadas:', newPhotos.length)
    console.log('Estrutura de pastas:', newFolderStructure)
  }

  const handleFolderImportClick = () => {
    folderInputRef.current?.click()
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleCreateAlbums = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userId || !formData.projectNamePrefix.trim()) {
      setError('Usuário e prefixo do nome são obrigatórios')
      return
    }

    if (Object.keys(folderStructure).length === 0) {
      setError('Adicione pelo menos uma foto para criar os álbuns')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const albumsData = Object.entries(folderStructure).map(([folderName, folderPhotos], index) => ({
        name: `${formData.projectNamePrefix} - ${folderName}`,
        albumSize: formData.albumSize,
        status: formData.status,
        photos: folderPhotos
      }))

      // Criar múltiplos projetos
      const response = await fetch('/api/admin/projects/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: formData.userId,
          albums: albumsData.map(album => ({
            name: album.name,
            albumSize: album.albumSize,
            status: album.status
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao criar projetos')
        return
      }

      const data = await response.json()
      const createdProjects = data.projects

      // Processar fotos para cada projeto criado
      if (createdProjects && createdProjects.length > 0) {
        try {
          // Controle de concorrência - processar em lotes menores
          const BATCH_SIZE = 3 // Máximo 3 uploads simultâneos
          const allUploads: Array<{
            promise: () => Promise<Response>
            photoIndex: number
            projectName: string
          }> = []

          // Preparar todos os uploads
          for (let i = 0; i < createdProjects.length; i++) {
            const project = createdProjects[i]
            const albumData = albumsData[i]
            
            if (albumData.photos && albumData.photos.length > 0) {
              for (let j = 0; j < albumData.photos.length; j++) {
                const photo = albumData.photos[j]
                const photoIndex = allUploads.length + 1
                
                if ('isTemp' in photo && photo.isTemp) {
                  // É uma foto temporária - fazer upload
                  allUploads.push({
                    promise: () => {
                      const formDataUpload = new FormData()
                      formDataUpload.append('files', photo.file)
                      formDataUpload.append('projectId', project.id)
                      formDataUpload.append('userId', formData.userId)

                      return fetch('/api/admin/photos', {
                        method: 'POST',
                        body: formDataUpload,
                        credentials: 'include',
                        signal: AbortSignal.timeout(60000) // Timeout de 60 segundos
                      })
                    },
                    photoIndex,
                    projectName: albumData.name
                  })
                } else {
                  // É uma foto existente - apenas associar ao projeto
                  allUploads.push({
                    promise: () => fetch(`/api/admin/photos/${photo.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      signal: AbortSignal.timeout(30000), // Timeout de 30 segundos
                      body: JSON.stringify({
                        projectId: project.id
                      })
                    }),
                    photoIndex,
                    projectName: albumData.name
                  })
                }
              }
            }
          }

          // Processar uploads em lotes
          const errors: string[] = []
          const successes: number[] = []
          
          for (let i = 0; i < allUploads.length; i += BATCH_SIZE) {
            const batch = allUploads.slice(i, i + BATCH_SIZE)
            console.log(`Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allUploads.length / BATCH_SIZE)} (${batch.length} fotos)`)
            
            const batchPromises = batch.map(upload => 
              upload.promise().then(response => ({ response, upload }))
            )
            
            const batchResults = await Promise.allSettled(batchPromises)
            
            // Verificar resultados do lote
            for (let j = 0; j < batchResults.length; j++) {
              const result = batchResults[j]
              const upload = batch[j]
              
              if (result.status === 'rejected') {
                console.error(`Erro no upload da foto ${upload.photoIndex} (${upload.projectName}):`, result.reason)
                
                // Verificar se é erro de timeout
                if (result.reason?.name === 'TimeoutError' || result.reason?.message?.includes('timeout')) {
                  errors.push(`Foto ${upload.photoIndex} (${upload.projectName}): Timeout - tente novamente`)
                } else {
                  errors.push(`Foto ${upload.photoIndex} (${upload.projectName}): Erro de conexão`)
                }
              } else {
                const { response } = result.value
                if (!response.ok) {
                  try {
                    const errorData = await response.json()
                    console.error(`Erro HTTP ${response.status} na foto ${upload.photoIndex}:`, errorData)
                    errors.push(`Foto ${upload.photoIndex} (${upload.projectName}): ${errorData.error || `HTTP ${response.status}`}`)
                  } catch {
                    errors.push(`Foto ${upload.photoIndex} (${upload.projectName}): Erro HTTP ${response.status}`)
                  }
                } else {
                  successes.push(upload.photoIndex)
                }
              }
            }
            
            // Pequena pausa entre lotes para não sobrecarregar o servidor
            if (i + BATCH_SIZE < allUploads.length) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
          
          console.log(`Upload concluído: ${successes.length} sucessos, ${errors.length} erros`)
          
          if (errors.length > 0) {
            console.error('Erros encontrados nos uploads:', errors)
            if (successes.length > 0) {
              setError(`Projetos criados! ${successes.length} fotos enviadas com sucesso, mas ${errors.length} falharam. Erros: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? '...' : ''}`)
            } else {
              setError(`Projetos criados, mas todas as fotos falharam no upload. Verifique o tamanho e formato das imagens.`)
            }
          } else {
            // Sucesso total
            console.log('Todos os uploads foram bem-sucedidos!')
          }

          // Limpar URLs temporárias para evitar memory leaks
          photos.forEach(photo => {
            if ('isTemp' in photo && photo.isTemp) {
              URL.revokeObjectURL(photo.url)
            }
          })

        } catch (photoError) {
          console.error('Erro ao processar fotos:', photoError)
          setError('Projetos criados, mas houve erro ao processar algumas fotos.')
        }
      }

      // Resetar formulário e fechar modal
      setFormData({
        userId: '',
        projectNamePrefix: '',
        albumSize: 'SIZE_20X20',
        status: 'DRAFT'
      })
      setPhotos([])
      setFolderStructure({})
      onProjectsCreated()
      onClose()
      
    } catch (error) {
      console.error('Error creating projects:', error)
      setError('Erro ao criar projetos. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Criar Múltiplos Projetos</h2>
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

          <form onSubmit={handleCreateAlbums} className="space-y-6">
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

            {/* Prefixo do Nome */}
            <div>
              <Label htmlFor="projectNamePrefix">Prefixo do Nome dos Projetos</Label>
              <Input
                id="projectNamePrefix"
                type="text"
                value={formData.projectNamePrefix}
                onChange={(e) => handleInputChange('projectNamePrefix', e.target.value)}
                placeholder="Ex: Evento 2024"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Os projetos serão nomeados como: "{formData.projectNamePrefix} - [Nome da Pasta]"
              </p>
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
              <Label>Fotos dos Projetos</Label>
              
              <div className="mt-2 space-y-4">
                {/* Botões de Upload */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFolderImportClick}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Importar Pastas
                  </Button>
                </div>

                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFolderUpload}
                  className="hidden"
                  {...({ webkitdirectory: "true" } as any)}
                />

                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: JPG, PNG. As fotos serão organizadas automaticamente em álbuns baseado no nome das pastas.
                </p>

                {/* Estrutura de Pastas */}
                {Object.keys(folderStructure).length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium">
                        Organização dos Álbuns ({Object.keys(folderStructure).length} álbuns)
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
                    
                    <div className="space-y-4">
                      {Object.entries(folderStructure).map(([folderName, folderPhotos]) => (
                        <div key={folderName} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center gap-2 mb-3">
                            <FolderOpen className="h-4 w-4 text-blue-500" />
                            <h5 className="font-medium text-sm">
                              {formData.projectNamePrefix} - {folderName}
                            </h5>
                            <span className="text-xs text-muted-foreground">
                              ({folderPhotos.length} fotos)
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {folderPhotos.map((photo) => (
                              <div key={photo.id} className="relative group">
                                <div className="aspect-square rounded overflow-hidden bg-gray-100">
                                  <NextImage
                                    src={photo.url}
                                    alt={photo.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => removePhoto(photo.id)}
                                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                                
                                {'isTemp' in photo && photo.isTemp && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-xs px-1 py-0.5 text-center">
                                    Temp
                                  </div>
                                )}
                              </div>
                            ))}
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
              <Label htmlFor="status">Status dos Projetos</Label>
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

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || Object.keys(folderStructure).length === 0}>
                {isLoading ? 'Criando...' : `Criar ${Object.keys(folderStructure).length} Projetos`}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}