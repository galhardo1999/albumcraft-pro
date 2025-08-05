'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FolderOpen, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { ALBUM_SIZES, type AlbumSizeConfig } from '@/lib/album-sizes'



export default function CreateBatchAlbumsPage() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [selectedAlbumSize, setSelectedAlbumSize] = useState<string>('SIZE_30X20')
  const [applyToAll, setApplyToAll] = useState(true)
  const [folders, setFolders] = useState<FileList | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    eventName: string
    albums: Array<{
      name: string
      photoCount: number
      samplePhotos: File[]
    }>
  } | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [createdAlbums, setCreatedAlbums] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  
  // Estados para barra de progresso
  const [isCreatingMultiple, setIsCreatingMultiple] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentAlbum, setCurrentAlbum] = useState('')
  const [totalAlbums, setTotalAlbums] = useState(0)
  const [isPollingStatus, setIsPollingStatus] = useState(false)
  const [queueProgress, setQueueProgress] = useState(0)

  // Função para obter estrutura de pastas
  const getFolderStructure = (): Map<string, File[]> => {
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

  // Obter estrutura de pastas
  const folderStructure = getFolderStructure()

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setFolders(files)
      console.log('Arquivos selecionados:', files.length)
    }
  }

  // Função para fazer polling do status da fila
  const pollQueueStatus = async (sessionId: string) => {
    setIsPollingStatus(true)
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/queue/status?sessionId=${sessionId}`)
        const data = await response.json()
        
        if (data.success) {
          setQueueProgress(data.progress)
          
          // Se o processamento estiver completo, parar o polling e redirecionar
          if (data.isProcessingComplete) {
            clearInterval(pollInterval)
            setIsPollingStatus(false)
            
            // Mostrar mensagem de sucesso
            setTimeout(() => {
              router.push('/projects')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status da fila:', error)
      }
    }, 2000) // Verificar a cada 2 segundos
    
    // Limpar o intervalo após 5 minutos (timeout de segurança)
    setTimeout(() => {
      clearInterval(pollInterval)
      setIsPollingStatus(false)
    }, 300000) // 5 minutos
  }

  const handlePreview = () => {
    if (!eventName || !selectedAlbumSize || folderStructure.size === 0) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const albums = Array.from(folderStructure.entries()).map(([folderName, files]) => ({
      name: folderName,
      photoCount: files.length,
      samplePhotos: files.slice(0, 3) // Primeiras 3 fotos como amostra
    }))

    setPreviewData({
      eventName,
      albums
    })
    setShowPreview(true)
  }

  const handleCreateAlbums = async () => {
    if (!eventName || !selectedAlbumSize || folderStructure.size === 0) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setIsUploading(true)
    setIsCreatingMultiple(true)
    setCreatedAlbums([])
    setErrors([])
    setProgress(0)

    try {
      const folders = Array.from(folderStructure.entries())
      setTotalAlbums(folders.length)
      
      // Preparar dados dos álbuns para envio em lote
      const albums = await Promise.all(
        folders.map(async ([folderName, files]) => {
          // Converter arquivos para Base64
          const processedFiles = await Promise.all(
            files.map(async (file) => {
              const buffer = await file.arrayBuffer()
              return {
                name: file.name,
                size: file.size,
                type: file.type,
                buffer: Buffer.from(buffer).toString('base64')
              }
            })
          )

          return {
            albumName: folderName,
            files: processedFiles
          }
        })
      )

      console.log(`🚀 Enviando ${albums.length} álbuns para processamento`)

      // Enviar todos os álbuns para a fila de uma vez
      const response = await fetch('/api/projects/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventName,
          albumSize: selectedAlbumSize,
          albums: albums,
          sessionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(`Erro na API: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      
      if (result.useQueue) {
        // Iniciar polling do status da fila
        pollQueueStatus(sessionId)
        setCurrentAlbum('Processando uploads para S3...')
      } else {
        // Fallback para processamento síncrono
        setTimeout(() => {
          router.push('/projects')
        }, 2000)
      }

    } catch (error) {
      console.error('Erro geral:', error)
      setErrors(prev => [...prev, `Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`])
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Criar Múltiplos Álbuns
          </h1>
          <p className="text-gray-600">
            Faça upload de uma pasta com subpastas de fotos para criar múltiplos álbuns automaticamente
          </p>
        </motion.div>

        <div className="grid gap-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Defina as configurações que serão aplicadas a todos os álbuns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eventName">Nome do Evento/Escola</Label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ex: Escola ABC, Formatura 2024, Casamento João e Maria"
                  className="mt-1"
                />
              </div>

              {/* Tamanho do Álbum */}
              <div>
                <Label htmlFor="albumSize">Tamanho do Álbum *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {/* Filtrar apenas os tamanhos 30x20 e 20x30 */}
                  {ALBUM_SIZES.filter(size => size.id === 'SIZE_30X20' || size.id === 'SIZE_20X30').map((size) => (
                    <div
                      key={size.id}
                      onClick={() => setSelectedAlbumSize(size.id)}
                      className={`
                        relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                        ${selectedAlbumSize === size.id 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${selectedAlbumSize === size.id 
                            ? 'border-primary bg-primary' 
                            : 'border-gray-300'
                          }
                        `}>
                          {selectedAlbumSize === size.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {size.displayName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="applyToAll"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="applyToAll">
                  Aplicar configurações para todos os álbuns
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Upload de Pastas */}
          <Card>
            <CardHeader>
              <CardTitle>Upload de Pastas</CardTitle>
              <CardDescription>
                Selecione a pasta principal que contém as subpastas com fotos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                onClick={() => document.getElementById('folder-upload')?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
              >
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="mb-4">
                  <span className="text-lg font-medium text-gray-900">
                    Clique para selecionar pasta
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecione a pasta que contém as subpastas com fotos
                  </p>
                  <input
                    id="folder-upload"
                    type="file"
                    // @ts-expect-error - webkitdirectory não está nos tipos padrão
                    webkitdirectory=""
                    multiple
                    onChange={handleFolderUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Estrutura de Pastas Detectada */}
              {folderStructure.size > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">
                    Pastas Detectadas ({folderStructure.size})
                  </h3>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {Array.from(folderStructure.entries()).map(([folderName, files]) => (
                        <div
                          key={folderName}
                          className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <FolderOpen className="h-8 w-8 text-blue-500 mb-2" />
                          <div className="text-center">
                            <div className="font-medium text-sm text-gray-900 truncate w-full" title={folderName}>
                              {folderName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {files.length} foto{files.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados */}
          {(createdAlbums.length > 0 || errors.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                {createdAlbums.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-700 mb-2">
                      Álbuns Criados com Sucesso ({createdAlbums.length})
                    </h4>
                    <div className="space-y-1">
                      {createdAlbums.map((albumName) => (
                        <div key={albumName} className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{albumName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      Erros ({errors.length})
                    </h4>
                    <div className="space-y-1">
                      {errors.map((error, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Barra de Progresso */}
          {(isCreatingMultiple || isPollingStatus) && (
            <Card>
              <CardHeader>
                <CardTitle>Criando Múltiplos Álbuns</CardTitle>
                <CardDescription>
                  {isPollingStatus 
                    ? 'Fazendo upload das fotos para o S3...' 
                    : 'Aguarde enquanto os álbuns são criados...'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progresso: {isPollingStatus ? queueProgress : progress}%</span>
                    <span>
                      {isPollingStatus 
                        ? `Upload para S3 em andamento...`
                        : `${createdAlbums.length} de ${totalAlbums} álbuns criados`
                      }
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${isPollingStatus ? queueProgress : progress}%` }}
                    />
                  </div>
                  
                  {currentAlbum && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {isPollingStatus 
                          ? <span className="font-medium">{currentAlbum}</span>
                          : <>Criando álbum: <span className="font-medium">{currentAlbum}</span></>
                        }
                      </p>
                    </div>
                  )}
                  
                  {((progress === 100 && !isPollingStatus) || (queueProgress === 100 && isPollingStatus)) && (
                    <div className="text-center">
                      <p className="text-green-600 font-medium">
                        ✅ Todos os álbuns foram criados e as fotos foram enviadas para o S3!
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Redirecionando para "Meus Álbuns" em alguns segundos...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isUploading}
            >
              Voltar
            </Button>
            
            <div className="flex gap-4">
              <Button
                onClick={handlePreview}
                disabled={!eventName || !selectedAlbumSize || folderStructure.size === 0 || isUploading}
                variant="outline"
                className="min-w-[200px]"
              >
                👁️ Visualizar Preview
              </Button>
              <Button
                onClick={handleCreateAlbums}
                disabled={!eventName || !selectedAlbumSize || folderStructure.size === 0 || isUploading || isCreatingMultiple || isPollingStatus}
                className="min-w-[200px]"
              >
                {isPollingStatus ? (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 animate-spin" />
                    <span>Upload S3... ({queueProgress}%)</span>
                  </div>
                ) : isCreatingMultiple ? (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 animate-spin" />
                    <span>Criando Álbuns... ({progress}%)</span>
                  </div>
                ) : isUploading ? (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 animate-spin" />
                    <span>Processando...</span>
                  </div>
                ) : (
                  `🚀 Criar ${folderStructure.size} Álbuns`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📋 Preview dos Álbuns</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">📝 Configurações Globais</h3>
                <p><strong>Evento:</strong> {previewData.eventName}</p>
                <p><strong>Tamanho do Álbum:</strong> {ALBUM_SIZES.find(size => size.id === selectedAlbumSize)?.displayName}</p>
                <p><strong>Total de Álbuns:</strong> {previewData.albums.length}</p>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg">📚 Álbuns que serão criados:</h3>
                {previewData.albums.map((album, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{album.name}</h4>
                        <p className="text-gray-600">{album.photoCount} fotos</p>
                      </div>
                    </div>
                    
                    {album.samplePhotos.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Primeiras fotos:</p>
                        <div className="flex gap-2">
                          {album.samplePhotos.map((file, photoIndex) => (
                            <div key={photoIndex} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${photoIndex + 1}`}
                                className="w-16 h-16 object-cover rounded border"
                                onLoad={(e) => {
                                  // Limpar URL do objeto após carregar para evitar vazamentos de memória
                                  setTimeout(() => {
                                    URL.revokeObjectURL((e.target as HTMLImageElement).src)
                                  }, 1000)
                                }}
                              />
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {photoIndex + 1}
                              </div>
                            </div>
                          ))}
                          {album.photoCount > 3 && (
                            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                              +{album.photoCount - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false)
                    handleCreateAlbums()
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ✅ Confirmar e Criar Álbuns
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}