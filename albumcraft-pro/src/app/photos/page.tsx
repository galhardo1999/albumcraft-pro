'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, Search, Upload } from 'lucide-react'
import Image from 'next/image'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'

interface Photo {
  id: string
  name: string
  url: string
  width: number
  height: number
  fileSize: number
  s3Key: string | null
  isS3Stored: boolean
  createdAt: string
  projectId: string | null
}

export default function PhotosPage() {
  const { logout } = useProtectedRoute()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

  // Buscar fotos do usuário
  const fetchPhotos = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/photos', {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          logout()
          return
        }
        throw new Error('Erro ao carregar fotos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
      setError('')
    } catch (error) {
      console.error('Erro ao buscar fotos:', error)
      setError('Erro ao carregar fotos')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar fotos por termo de busca
  useEffect(() => {
    const filtered = photos.filter(photo =>
      photo.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPhotos(filtered)
  }, [photos, searchTerm])

  // Carregar fotos ao montar o componente
  useEffect(() => {
    fetchPhotos()
  }, [])

  // Função para deletar foto
  const deletePhoto = async (photoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeletingPhotoId(photoId)
      
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao deletar foto')
      }

      const result = await response.json()
      console.log('✅ Foto deletada:', result)

      // Remover foto da lista local
      setPhotos(prev => prev.filter(photo => photo.id !== photoId))
      
      // Mostrar feedback de sucesso
      alert(`Foto deletada com sucesso!\n\nDetalhes:\n- Arquivos S3 deletados: ${result.s3Deletion.totalDeleted}\n- Erros: ${result.s3Deletion.hasErrors ? 'Sim' : 'Não'}`)
      
    } catch (error) {
      console.error('❌ Erro ao deletar foto:', error)
      alert(`Erro ao deletar foto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setDeletingPhotoId(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando fotos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Fotos</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as suas fotos
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Barra de busca e estatísticas */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar fotos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredPhotos.length} de {photos.length} fotos
            </div>
            <Button onClick={fetchPhotos} variant="outline" size="sm">
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de fotos */}
      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhuma foto encontrada' : 'Nenhuma foto encontrada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar o termo de busca' 
                : 'Você ainda não possui fotos. Faça upload através dos projetos.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="aspect-square relative bg-muted">
                <Image
                  src={photo.url}
                  alt={photo.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate mb-2" title={photo.name}>
                  {photo.name}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Dimensões:</span>
                    <span>{photo.width}×{photo.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho:</span>
                    <span>{formatFileSize(photo.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Criado:</span>
                    <span>{formatDate(photo.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>S3:</span>
                    <span className={photo.isS3Stored ? 'text-green-600' : 'text-orange-600'}>
                      {photo.isS3Stored ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  {photo.projectId && (
                    <div className="flex justify-between">
                      <span>Projeto:</span>
                      <span className="text-blue-600">Associada</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePhoto(photo.id)}
                    disabled={deletingPhotoId === photo.id}
                    className="w-full"
                  >
                    {deletingPhotoId === photo.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Foto
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}