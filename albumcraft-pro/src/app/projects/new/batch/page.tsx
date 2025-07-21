'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FolderOpen, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotifications, useAlbumProgress } from '@/hooks/useNotifications'
import { ALBUM_TEMPLATES, AlbumTemplate } from '@/lib/album-sizes'

export default function CreateBatchAlbumsPage() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [applyToAll, setApplyToAll] = useState(true)
  const [folders, setFolders] = useState<FileList | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    eventName: string
    template: string
    albums: Array<{
      name: string
      photoCount: number
      samplePhotos: File[]
    }>
  } | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [useRealTimeNotifications, setUseRealTimeNotifications] = useState(true)
  const [createdAlbums, setCreatedAlbums] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])

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

  // Hooks para notificações em tempo real
  const { 
    notifications, 
    queueStats, 
    isConnected, 
    connectionError,
    clearNotifications,
    reconnect
  } = useNotifications(sessionId)
  
  const { 
    albumProgress, 
    completedAlbums, 
    failedAlbums 
  } = useAlbumProgress(sessionId)

  // Templates de álbuns padronizados
  const albumTemplates: AlbumTemplate[] = ALBUM_TEMPLATES

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setFolders(files)
      console.log('Arquivos selecionados:', files.length)
    }
  }

  const handlePreview = () => {
    if (!eventName || !selectedTemplate || folderStructure.size === 0) {
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
      template: selectedTemplate,
      albums
    })
    setShowPreview(true)
  }

  const handleCreateAlbums = async () => {
    if (!eventName || !selectedTemplate || folderStructure.size === 0) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setIsUploading(true)
    setCreatedAlbums([])
    setErrors([])

    try {
      const folders = Array.from(folderStructure.entries())
      
      // Preparar dados dos álbuns
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
            template: selectedTemplate,
            files: processedFiles
          }
        })
      )

      console.log(`🚀 Enviando ${albums.length} álbuns para processamento`)

      // Enviar para API com sistema de filas
      const response = await fetch('/api/projects/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          eventName,
          albums,
          sessionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(`Erro na API: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      
      if (result.useQueue) {
        alert(`✅ ${albums.length} álbuns adicionados à fila de processamento!\n\nVocê pode acompanhar o progresso em tempo real abaixo.`)
      } else {
        alert(`✅ ${albums.length} álbuns processados com sucesso!\n\n⚠️ Sistema de filas não disponível, processamento foi síncrono.`)
      }

    } catch (error) {
      console.error('Erro geral:', error)
      alert(`❌ Erro ao processar álbuns: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
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

              <div>
                <Label htmlFor="template">Modelo do Álbum</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {albumTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500">
                            {template.description} • {template.pages} páginas
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Seção de Notificações em Tempo Real */}
          {useRealTimeNotifications && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Notificações em Tempo Real
              </h3>
              
              {/* Estatísticas da Fila */}
              {queueStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600">Aguardando</div>
                    <div className="text-xl font-bold text-blue-800">{queueStats.waiting}</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-sm text-yellow-600">Processando</div>
                    <div className="text-xl font-bold text-yellow-800">{queueStats.active}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600">Concluídos</div>
                    <div className="text-xl font-bold text-green-800">{queueStats.completed}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-red-600">Falharam</div>
                    <div className="text-xl font-bold text-red-800">{queueStats.failed}</div>
                  </div>
                </div>
              )}

              {/* Progresso dos Álbuns */}
              {albumProgress && Object.keys(albumProgress).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Progresso dos Álbuns:</h4>
                  {Object.entries(albumProgress).map(([albumName, progress]) => (
                    <div key={albumName} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{albumName}</span>
                        <span className="text-gray-600">{(progress.current as number)}/{(progress.total as number)} fotos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((progress.current as number) / (progress.total as number)) * 100}%` }}
                        ></div>
                      </div>
                      {(progress.status as string) && (
                        <div className={`text-xs ${
                          progress.status === 'completed' ? 'text-green-600' :
                          progress.status === 'failed' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          Status: {progress.status === 'completed' ? 'Concluído' :
                                  progress.status === 'failed' ? 'Falhou' :
                                  progress.status === 'processing' ? 'Processando' : 'Aguardando'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de Notificações */}
              {notifications.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700">Notificações Recentes:</h4>
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {notifications.slice(-10).reverse().map((notification, index) => (
                      <div 
                        key={`${notification.sessionId}-${notification.timestamp}-${index}`} 
                        className={`text-xs p-2 rounded ${
                          notification.type === 'album_completed' ? 'bg-green-50 text-green-700' :
                          notification.type === 'album_failed' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}
                      >
                        <div className="font-medium">{notification.message}</div>
                        <div className="text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controles */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={reconnect}
                  disabled={isConnected}
                  className={`px-3 py-1 text-xs rounded ${
                    isConnected 
                      ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isConnected ? 'Conectado' : 'Reconectar'}
                </button>
                <div className={`px-3 py-1 text-xs rounded ${
                  isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isConnected ? '🟢 Online' : '🔴 Offline'}
                </div>
              </div>
            </div>
          )}

          {/* Upload de Pastas */}
          <Card>
            <CardHeader>
              <CardTitle>Upload de Pastas</CardTitle>
              <CardDescription>
                Selecione a pasta principal que contém as subpastas com fotos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="mb-4">
                  <Label htmlFor="folder-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-900">
                      Clique para selecionar pasta
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Selecione a pasta que contém as subpastas com fotos
                    </p>
                  </Label>
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
                  <div className="grid gap-3">
                    {Array.from(folderStructure.entries()).map(([folderName, files]) => (
                      <div
                        key={folderName}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">{folderName}</div>
                            <div className="text-sm text-gray-500">
                              {files.length} foto(s)
                            </div>
                          </div>
                        </div>
                        
                        {isUploading && albumProgress[folderName] !== undefined && (
                          <div className="flex items-center space-x-2">
                            {albumProgress[folderName]?.progress === 100 ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="text-sm text-gray-500">
                                {String(albumProgress[folderName]?.progress || 0)}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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
                disabled={!eventName || !selectedTemplate || folderStructure.size === 0 || isUploading}
                variant="outline"
                className="min-w-[200px]"
              >
                👁️ Visualizar Preview
              </Button>
              <Button
                onClick={handleCreateAlbums}
                disabled={!eventName || !selectedTemplate || folderStructure.size === 0 || isUploading}
                className="min-w-[200px]"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 animate-spin" />
                    <span>Criando Álbuns...</span>
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
                <p><strong>Template:</strong> {previewData.template}</p>
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