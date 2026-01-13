export type AlbumStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
export type AlbumCreationType = 'SINGLE' | 'BATCH'
export type AlbumSize =
    | 'SIZE_15X15' | 'SIZE_20X20' | 'SIZE_25X25' | 'SIZE_30X30'
    | 'SIZE_20X15' | 'SIZE_30X20' | 'SIZE_40X30'
    | 'SIZE_15X20' | 'SIZE_20X30' | 'SIZE_30X40'
    | 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE' | 'CUSTOM'

export interface Photo {
    id: string
    url: string
    thumbnailUrl: string
    filename: string
    width: number
    height: number
    mimeType: string
    size: number
    createdAt: string
    updatedAt: string
}

export interface Page {
    id: string
    pageNumber: number
    albumId: string
    layoutId?: string
    backgroundColor?: string
    backgroundImageUrl?: string
    createdAt: string
    updatedAt: string
    photoPlacements: PhotoPlacement[]
}

export interface PhotoPlacement {
    id: string
    pageId: string
    photoId: string
    x: number
    y: number
    width: number
    height: number
    rotation: number
    zIndex: number
    photo?: Photo
}

export interface Album {
    id: string
    name: string
    description?: string
    albumSize: string // Keeping string to allow flexibility but usually matches AlbumSize
    status: AlbumStatus
    creationType: AlbumCreationType
    coverPhotoUrl?: string
    group?: string
    userId: string
    customWidth?: number
    customHeight?: number
    createdAt: string
    updatedAt: string
    _count?: {
        pages: number
        photos?: number
    }
    photos?: Photo[]
    pages?: Page[]
}

export interface AlbumStats {
    totalPhotos: number
    totalPages: number
    completionPercentage: number
}
