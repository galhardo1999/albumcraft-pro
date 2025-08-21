// Tipos centralizados para Álbuns
// Padronização: usamos 'Album' em vez de 'Project' em todo o código

export interface Album {
  id: string
  name: string
  description?: string
  albumSize: string
  status: string
  creationType: string
  group?: string
  createdAt: string
  updatedAt: string
  photos?: Array<{
    id: string
    filename: string
    thumbnailUrl: string
  }>
  _count: {
    pages: number
    photos?: number
  }
}

export interface AlbumDetails extends Album {
  pages: Array<{
    id: string
    pageNumber: number
    elements: unknown[]
  }>
  settings?: Record<string, unknown>
}

export interface AlbumStats {
  totalAlbums: number
  activeAlbums: number
  newAlbums: number
  albumsByStatus: Array<{
    status: string
    count: number
    _count: {
      status: number
    }
  }>
}

export interface AlbumCreationData {
  name: string
  description?: string
  albumSize: string
  status?: string
  creationType?: string
  group?: string
}

export interface BatchAlbumCreation {
  eventName: string
  albumSize: string
  albums: Array<{
    name: string
    photoCount: number
    files: File[]
  }>
}

// Tipos para compatibilidade durante a migração
// TODO: Remover após migração completa
export type Project = Album
export type ProjectDetails = AlbumDetails
export type ProjectStats = AlbumStats
export type ProjectCreationData = AlbumCreationData
export type BatchProjectCreation = BatchAlbumCreation