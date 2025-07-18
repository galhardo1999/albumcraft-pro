'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Search, Image as ImageIcon, Calendar, User, AlertTriangle } from 'lucide-react'

interface Photo {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  mediumUrl?: string
  uploadedAt: string
  userId: string
  projectId?: string
  project?: {
    id: string
    name: string
  }
}

export default function PhotosManagementPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Buscar fotos do usuário
  const fetchPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/photos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar fotos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
      setFilteredPhotos(data.photos || [])
    } catch (error) {
      console.error('Erro ao buscar fotos:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar fotos por termo de busca
  useEffect(() => {
    const filtered = photos.filter(photo =>
      photo.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPhotos(filtered)
  }, [photos, searchTerm])

  // Carregar fotos ao montar o componente
  useEffect(() => {
    fetchPhotos()
  }, [])

  // Função para deletar foto
  const handleDeletePhoto = async (photoId: string, filename: string) => {
    if (!confirm(`Tem certeza que deseja excluir a foto "${filename}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeletingIds(prev => [...prev, photoId])

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir foto')
      }

      // Remove a foto da lista local
      setPhotos(prev => prev.filter(photo => photo.id !== photoId))
      setFilteredPhotos(prev => prev.filter(photo => photo.id !== photoId))
      
      alert(`✅ Foto "${filename}" excluída com sucesso!\n\nDetalhes:\n${result.message}`)
    } catch (error) {
      console.error('Erro ao excluir foto:', error)
      alert(`❌ Erro ao excluir foto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== photoId))
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

  if (loading) {
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
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate mb-2" title={photo.originalName}>
                  {photo.originalName}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(photo.uploadedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    <span>{formatFileSize(photo.size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="truncate">{photo.filename}</span>
                  </div>
                  {photo.project && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {photo.project.name}
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePhoto(photo.id, photo.originalName)}
                  disabled={deletingIds.includes(photo.id)}
                  className="w-full"
                >
                  {deletingIds.includes(photo.id) ? (
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}