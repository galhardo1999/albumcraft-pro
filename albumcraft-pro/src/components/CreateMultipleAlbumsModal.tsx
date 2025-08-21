'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { X, Trash2, FolderOpen } from 'lucide-react'
import { getPopularSizes, getSizesByCategory, formatSizeDisplay, AlbumSizeConfig } from '@/lib/album-sizes'
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
  albumId?: string | null
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

interface ExistingPhoto {
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl?: string
  createdAt: string
}

interface ApiPhotoData {
  id: string
  s3Url?: string
  originalUrl?: string
  url?: string
  filename?: string
  name?: string
  width?: number
  height?: number
  size?: number
  fileSize?: number
  albumId?: string | null
}

// Interface unificada para fotos (persistidas ou temporárias)
type PhotoItem = Photo | TempPhoto

interface CreateMultipleAlbumsModalProps {
  isOpen: boolean
  onClose: () => void
  onAlbumsCreated: () => void
}

interface FolderStructure {
  [folderName: string]: PhotoItem[]
}

export default function CreateMultipleAlbumsModal({ isOpen, onClose, onAlbumsCreated }: CreateMultipleAlbumsModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
    group: '',
    eventName: '',
    albumSize: 'SIZE_20X20',
    status: 'DRAFT'
  })
  const [users, setUsers] = useState<User[]>([])
  const [photos, setPhotos] = useState<PhotoItem[]>([])  
  const [tempPhotos, setTempPhotos] = useState<TempPhoto[]>([])  
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([])  
  const [selectedExistingPhotos, setSelectedExistingPhotos] = useState<Set<string>>(new Set())  
  const [showExistingPhotos, setShowExistingPhotos] = useState(false)  
  const [loadingExistingPhotos, setLoadingExistingPhotos] = useState(false)  
  const [useQueue, setUseQueue] = useState(true)
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

  // Função para carregar fotos existentes do usuário selecionado
  const loadExistingPhotos = async (userId: string) => {
    if (!userId) return
    
    setLoadingExistingPhotos(true)
    try {
      const response = await fetch(`/api/admin/photos?userId=${userId}`, {
        credentials: 'include',
      })
      const result = await response.json().catch(() => null)
      if (response.ok && result?.success && Array.isArray(result.data)) {
        const mapped: Photo[] = result.data.map((p: ApiPhotoData) => ({
          id: p.id,
          url: p.s3Url ?? p.originalUrl ?? p.url ?? '',
          name: p.filename ?? p.name ?? 'Foto',
          width: p.width ?? 0,
          height: p.height ?? 0,
          fileSize: p.size ?? p.fileSize ?? 0,
          albumId: p.albumId ?? null,
        }))
        setExistingPhotos(mapped)
      } else {
        setExistingPhotos([])
      }
    } catch (error) {
      console.error('Erro ao carregar fotos existentes:', error)
      setExistingPhotos([])
    } finally {
      setLoadingExistingPhotos(false)
    }
  }

  // Função para upload de arquivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9)
        const url = URL.createObjectURL(file)
        
        const tempPhoto: TempPhoto = {
          id,
          file,
          name: file.name,
          url,
          width: 0, // Será atualizado quando a imagem carregar
          height: 0, // Será atualizado quando a imagem carregar
          fileSize: file.size,
          isTemp: true
        }
        
        setTempPhotos(prev => [...prev, tempPhoto])
      }
    })
    
    // Limpar input
    event.target.value = ''
  }

  // Função para remover foto temporária
  const removeTempPhoto = (id: string) => {
    setTempPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo) {
        URL.revokeObjectURL(photo.url)
      }
      return prev.filter(p => p.id !== id)
    })
  }

  // Função para alternar seleção de foto existente
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

  // Função para converter arquivo para Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remover o prefixo "data:image/...;base64,"
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
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

  // Carregar fotos existentes quando o usuário mudar
  useEffect(() => {
    if (formData.userId) {
      loadExistingPhotos(formData.userId)
    } else {
      setExistingPhotos([])
      setSelectedExistingPhotos(new Set())
    }
  }, [formData.userId])

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
    
    if (!formData.userId || !formData.group.trim()) {
      setError('Usuário e nome do grupo são obrigatórios')
      return
    }

    if (Object.keys(folderStructure).length === 0) {
      setError('Adicione pelo menos uma foto para criar os álbuns')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const albumsData = await Promise.all(
        Object.entries(folderStructure).map(async ([folderName, folderPhotos]) => {
          // Converter fotos para Base64 se usar sistema de filas
          let processedFiles = undefined
          
          if (useQueue && folderPhotos.length > 0) {
            processedFiles = await Promise.all(
              folderPhotos.map(async (photo) => {
                if ('isTemp' in photo && photo.isTemp) {
                  return {
                    name: photo.name,
                    size: photo.fileSize,
                    type: photo.file.type,
                    buffer: await fileToBase64(photo.file)
                  }
                } else {
                  // Para fotos existentes, apenas retornar referência
                  return {
                    existingPhotoId: photo.id,
                    name: photo.name
                  }
                }
              })
            )
          }
          
          return {
            name: folderName,
            albumSize: formData.albumSize,
            status: formData.status,
            group: formData.group,
            eventName: formData.eventName || null,
            files: processedFiles,
            photos: folderPhotos
          }
        })
      )

      // Criar múltiplos álbuns
      const response = await fetch('/api/admin/albums/batch', {
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
            status: album.status,
            group: formData.group,
            eventName: formData.eventName || null,
            files: album.files
          })),
          sessionId: `admin-${Date.now()}`,
          useQueue
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao criar álbuns')
        return
      }

      const data = await response.json()
      
      // Se a criação foi enviada para a fila (useQueue=true), a API não retorna os álbuns prontos
      // Encerramos o fluxo aqui com sucesso e deixamos o worker processar
      if (data.useQueue) {
        // Resetar formulário e fechar modal
        setFormData({
          userId: '',
          group: '',
          eventName: '',
          albumSize: 'SIZE_20X20',
          status: 'DRAFT'
        })
        setPhotos([])
        setFolderStructure({})
        onAlbumsCreated()
        onClose()
        return
      }

      // Modo síncrono: API retorna { albums: [...] }
      const createdAlbums = data.albums || data.projects

      // Processar fotos para cada álbum criado
      if (createdAlbums && createdAlbums.length > 0) {
        try {
          // Controle de concorrência - processar em lotes menores
          const BATCH_SIZE = 3 // Máximo 3 uploads simultâneos
          const allUploads: Array<{
            promise: () => Promise<Response>
            photoIndex: number
            albumName: string
          }> = []

          // Preparar todos os uploads
          for (let i = 0; i < createdAlbums.length; i++) {
            const album = createdAlbums[i]
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
                      formDataUpload.append('albumId', album.id)
                      formDataUpload.append('userId', formData.userId)

                      return fetch('/api/admin/photos', {
                        method: 'POST',
                        body: formDataUpload,
                        credentials: 'include',
                        signal: AbortSignal.timeout(60000) // Timeout de 60 segundos
                      })
                    },
                    photoIndex,
                    albumName: albumData.name
                  })
                } else {
                  // É uma foto existente - apenas associar ao álbum
                  allUploads.push({
                    promise: () => fetch(`/api/admin/photos/${photo.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      signal: AbortSignal.timeout(30000), // Timeout de 30 segundos
                      body: JSON.stringify({
                        albumId: album.id
                      })
                    }),
                    photoIndex,
                    albumName: albumData.name
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
                console.error(`Erro no upload da foto ${upload.photoIndex} (${upload.albumName}):`, result.reason)
                
                // Verificar se é erro de timeout
                if (result.reason?.name === 'TimeoutError' || result.reason?.message?.includes('timeout')) {
                  errors.push(`Foto ${upload.photoIndex} (${upload.albumName}): Timeout - tente novamente`)
                } else {
                  errors.push(`Foto ${upload.photoIndex} (${upload.albumName}): Erro de conexão`)
                }
              } else {
                const { response } = result.value
                if (!response.ok) {
                  try {
                    const errorData = await response.json()
                    console.error(`Erro HTTP ${response.status} na foto ${upload.photoIndex}:`, errorData)
                    errors.push(`Foto ${upload.photoIndex} (${upload.albumName}): ${errorData.error || `HTTP ${response.status}`}`)
                  } catch {
                    errors.push(`Foto ${upload.photoIndex} (${upload.albumName}): Erro HTTP ${response.status}`)
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
              setError(`Álbuns criados! ${successes.length} fotos enviadas com sucesso, mas ${errors.length} falharam. Erros: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? '...' : ''}`)
            } else {
              setError(`Álbuns criados, mas todas as fotos falharam no upload. Verifique o tamanho e formato das imagens.`)
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
          setError('Álbuns criados, mas houve erro ao processar algumas fotos.')
        }
      }

      // Resetar formulário e fechar modal
      setFormData({
        userId: '',
        group: '',
        eventName: '',
        albumSize: 'SIZE_20X20',
        status: 'DRAFT'
      })
      setPhotos([])
      setFolderStructure({})
      onAlbumsCreated()
      onClose()
      
    } catch (error) {
      console.error('Error creating albums:', error)
      setError('Erro ao criar álbuns. Tente novamente.')
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
            <h2 className="text-xl font-semibold">Criar Múltiplos Álbuns</h2>
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

            {/* Nome do Grupo */}
            <div>
              <Label htmlFor="group">Nome do Grupo</Label>
              <Input
                id="group"
                type="text"
                value={formData.group}
                onChange={(e) => handleInputChange('group', e.target.value)}
                placeholder="Ex: Turma A, Equipe Marketing"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Nome do grupo ou turma para identificação dos álbuns múltiplos
              </p>
            </div>

            {/* Nome do Evento */}
            <div>
              <Label htmlFor="eventName">Nome do Evento</Label>
              <Input
                id="eventName"
                type="text"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                placeholder="Ex: Formatura 2024, Workshop Fotografia"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Nome do evento (opcional) para contexto adicional
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
                    onClick={() => setSelectedCategory(key as 'popular' | 'square' | 'landscape' | 'portrait')}
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
              <Label>Fotos dos Álbuns</Label>
              
              <div className="mt-2 space-y-4">
                {/* Botões de Upload */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFolderImportClick}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Importar Pastas
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    📷 Upload de Fotos
                  </Button>
                  
                  {formData.userId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowExistingPhotos(!showExistingPhotos)}
                      className="flex items-center gap-2"
                    >
                      📁 Fotos Existentes ({existingPhotos.length})
                    </Button>
                  )}
                </div>

                {/* Input de upload de fotos */}
                <input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFolderUpload}
                  className="hidden"
                  {...({ webkitdirectory: "true" } as React.InputHTMLAttributes<HTMLInputElement>)}
                />

                {/* Opção de usar sistema de filas */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useQueue"
                    checked={useQueue}
                    onChange={(e) => setUseQueue(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="useQueue" className="text-sm">
                    Usar sistema de filas (recomendado para muitas fotos)
                  </Label>
                </div>

                {/* Fotos Temporárias */}
                {tempPhotos.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Fotos Carregadas ({tempPhotos.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {tempPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <NextImage
                              src={photo.url}
                              alt={photo.name}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTempPhoto(photo.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fotos Existentes */}
                {showExistingPhotos && (
                  <div>
                    <h4 className="font-medium mb-2">
                      Fotos Existentes do Usuário 
                      {loadingExistingPhotos && <span className="text-sm text-gray-500 ml-2">(Carregando...)</span>}
                    </h4>
                    {existingPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                        {existingPhotos.map((photo) => (
                           <div 
                             key={photo.id} 
                             className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                               selectedExistingPhotos.has(photo.id) 
                                 ? 'border-blue-500 bg-blue-50' 
                                 : 'border-gray-200 hover:border-gray-300'
                             }`}
                             onClick={() => toggleExistingPhoto(photo.id)}
                           >
                             <div className="aspect-square bg-gray-100">
                               <NextImage
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
                             <p className="text-xs text-gray-600 p-1 truncate">{photo.name}</p>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-sm text-gray-500">Nenhuma foto encontrada para este usuário.</p>
                     )}
                   </div>
                 )}

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
                              {folderName}
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
              <Label htmlFor="status">Status dos Álbuns</Label>
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
                {isLoading ? 'Criando...' : `Criar ${Object.keys(folderStructure).length} Álbuns`}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}