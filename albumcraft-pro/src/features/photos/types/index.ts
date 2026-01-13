export interface Photo {
    id: string
    userId: string
    albumId?: string | null
    filename: string
    originalName: string
    mimeType: string
    size: number
    width?: number | null
    height?: number | null
    s3Key: string
    s3Url: string
    metadata?: any
    createdAt: Date
    updatedAt: Date
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
    filters?: any
    photo?: Photo
}
