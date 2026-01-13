'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { uploadPhotoAction } from '@/features/photos/actions/upload-photo.action'

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
  albumId?: string
}

export default function PhotoGallery({ photos, onPhotoDragStart, onPhotoDragEnd, onPhotoImport, albumId }: PhotoGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredPhotos = photos.filter(photo =>
    photo.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises: Promise<any>[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        if (albumId) {
          formData.append('albumId', albumId)
        }

        uploadPromises.push(uploadPhotoAction(null, formData))
      }

      const results = await Promise.all(uploadPromises)

      const successfulPhotos: Photo[] = []
      const errors: string[] = []

      results.forEach((result, index) => {
        if (result.success && result.photo) {
          const p = result.photo
          successfulPhotos.push({
            id: p.id,
            originalUrl: p.s3Url, // or p.originalUrl if mapped
            filename: p.filename,
            width: p.width || 0,
            height: p.height || 0,
            fileSize: p.size,
            albumId: p.albumId,
            thumbnailUrl: p.s3Url, // Using original as thumb for now if not processed
            mediumUrl: p.s3Url
          })
        } else {
          errors.push(result.error || `Error uploading file ${index + 1}`)
        }
      })

      if (successfulPhotos.length > 0) {
        // Need to adapt the photo object to what PhotoGallery expects
        // The service returns Prisma Photo object. 
        // We might need to ensure URL mapping is correct.
        onPhotoImport(successfulPhotos)
      }

      if (errors.length > 0) {
        console.error('Errors uploading photos:', errors)
        alert(`Algumas fotos falharam ao enviar: ${errors.length}`)
      } else if (successfulPhotos.length > 0) {
        // success message optional
      }

    } catch (error) {
      console.error('Erro ao fazer upload das fotos:', error)
      alert('Erro ao fazer upload das fotos. Tente novamente.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
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
      <div className="aspect-square bg-muted relative overflow-hidden">
        <Image
          src={photo.thumbnailUrl || photo.originalUrl}
          alt={photo.filename}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
      </div>

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
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Galeria de Fotos</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {photos.length} foto{photos.length !== 1 ? 's' : ''}
            </span>
            <Button size="sm" onClick={handleImportClick} disabled={isUploading} aria-label="Importar novas fotos">
              {isUploading ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Importar
            </Button>
          </div>
        </div>

        <Input
          placeholder="Buscar fotos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8"
        />
      </div>

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
              <Button size="sm" variant="outline" onClick={handleImportClick} disabled={isUploading}>
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