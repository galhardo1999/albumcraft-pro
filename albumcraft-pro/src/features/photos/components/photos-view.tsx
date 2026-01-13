'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { deletePhotoAction } from '@/features/photos/actions/delete-photo.action'
import { Photo } from '@/features/photos/types'

interface PhotosViewProps {
    initialPhotos: Photo[]
}

export function PhotosView({ initialPhotos }: PhotosViewProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (photoId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta foto?')) return

        setDeletingId(photoId)
        try {
            const result = await deletePhotoAction(photoId)
            if (result.success) {
                setPhotos(prev => prev.filter(p => p.id !== photoId))
            } else {
                alert('Erro ao excluir foto: ' + result.error)
            }
        } catch (error) {
            console.error('Error deleting photo:', error)
            alert('Erro ao excluir foto')
        } finally {
            setDeletingId(null)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    if (photos.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhuma foto encontrada</h3>
                <p className="mt-1 text-gray-500">
                    Suas fotos aparecerão aqui quando você criar álbuns.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                    <Image
                        src={photo.s3Url}
                        alt={photo.filename}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-xs font-medium truncate mb-1">
                            {photo.filename}
                        </p>
                        <p className="text-white/80 text-[10px] mb-2">
                            {formatFileSize(photo.size)}
                        </p>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => handleDelete(photo.id)}
                            disabled={deletingId === photo.id}
                        >
                            {deletingId === photo.id ? 'Excluindo...' : 'Excluir'}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
