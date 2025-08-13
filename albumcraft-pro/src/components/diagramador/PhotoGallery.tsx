'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

interface Photo {
  id: string
  originalUrl: string
  filename: string
  width: number
  height: number
  fileSize: number
  albumId?: string | null
  thumbnailUrl?: string
  mediumUrl?: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  onPhotoDragStart: (photo: Photo) => void
  onPhotoDragEnd?: () => void
  onPhotoImport: (newPhotos: Photo[]) => void
  albumId?: string // Novo prop para associar fotos ao álbum
}

export default function PhotoGallery({ photos, onPhotoDragStart, onPhotoDragEnd, onPhotoImport, albumId }: PhotoGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtrar fotos apenas por busca
  const filteredPhotos = photos.filter(photo => 
    photo.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      // Criar FormData para enviar os arquivos
      const formData = new FormData()
      
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }
      
      // Incluir albumId se fornecido
    if (albumId) {
      formData.append('albumId', albumId)
      }
      
      // A API irá buscar automaticamente o primeiro usuário disponível
      
      // Fazer upload via API
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Erro no upload das fotos')
      }
      
      const result = await response.json()
      
      if (result.success && result.photos) {
        // Chamar callback para adicionar as fotos
        onPhotoImport(result.photos)
        alert(result.message || 'Fotos enviadas com sucesso!')
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
      
      // Limpar o input
      event.target.value = ''
      
    } catch (error) {
      console.error('Erro ao fazer upload das fotos:', error)
      alert('Erro ao fazer upload das fotos. Tente novamente.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const PhotoItem = ({ photo }: { photo: Photo }) => (
    <div
      key={photo.id}
      className="relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all border-transparent hover:border-muted-foreground/30"
      draggable
      onDragStart={() => onPhotoDragStart(photo)}
      onDragEnd={() => onPhotoDragEnd?.()}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        <Image
          src={photo.thumbnailUrl || photo.originalUrl}
          alt={photo.filename}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Informações da foto */}
      <div className="p-2">
        <p className="text-xs font-medium truncate" title={photo.filename}>
          {photo.filename}
        </p>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground">
            {photo.width}×{photo.height}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(photo.fileSize)}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Galeria de Fotos</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {photos.length} foto{photos.length !== 1 ? 's' : ''}
            </span>
            <Button size="sm" onClick={handleImportClick} aria-label="Importar novas fotos">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Importar
            </Button>
          </div>
        </div>
        
        {/* Busca */}
        <Input
          placeholder="Buscar fotos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8"
        />
      </div>

      {/* Lista de Fotos */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {searchTerm ? 'Nenhuma foto encontrada' : 'Nenhuma foto importada'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {searchTerm ? 'Tente ajustar o termo de busca' : 'Clique em "Importar" para adicionar fotos'}
            </p>
            {!searchTerm && (
              <Button size="sm" variant="outline" onClick={handleImportClick}>
                Importar Fotos
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredPhotos.map(photo => (
              <PhotoItem key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}