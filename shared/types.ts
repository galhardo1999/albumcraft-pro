// Shared types exported from Prisma
export type { User, Album, Photo, Slide, AlbumJob } from '@prisma/client';

// Additional types for the application
export interface AlbumWithDetails extends Album {
  photos: Photo[];
  slides: Slide[];
  user: User;
}

export interface SlideWithPhotos extends Slide {
  photos: Photo[];
}

export interface UserStats {
  totalAlbums: number;
  photosUsed: number;
  exports: number;
  storageUsed: number;
  storageLimit: number;
}

export interface CreateAlbumData {
  name: string;
  size?: string;
  orientation?: string;
  status?: string;
}

export interface CreatePhotoData {
  albumId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  url: string;
  thumbnailUrl?: string;
  order?: number;
}

export interface CreateSlideData {
  albumId: string;
  order?: number;
  layout?: string;
  photoPositions?: any;
}