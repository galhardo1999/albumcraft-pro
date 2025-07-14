import { PrismaClient, User, Album, Photo, Slide, AlbumJob } from '@prisma/client';
import prisma from './prisma.js';

export interface AlbumWithDetails extends Album {
  photos: Photo[];
  slides: Slide[];
  user: User;
}

export interface SlideWithPhotos extends Slide {
  photos: Photo[];
}

export class Storage {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { id }
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { email }
    });
  }

  async createUser(userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    plan?: string;
    password?: string;
  }): Promise<User> {
    return await this.db.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        plan: userData.plan || 'FREE',
        password: userData.password,
      }
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return await this.db.user.update({
      where: { id },
      data: {
        ...userData,
        updatedAt: new Date(),
      }
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id }
    });
  }

  // Album operations
  async createAlbum(albumData: {
    userId: string;
    name: string;
    size?: string;
    orientation?: string;
    status?: string;
  }): Promise<Album> {
    return await this.db.album.create({
      data: {
        userId: albumData.userId,
        name: albumData.name,
        size: albumData.size || 'A4',
        orientation: albumData.orientation || 'Landscape',
        status: albumData.status || 'draft',
      }
    });
  }

  async getAlbum(id: string): Promise<Album | null> {
    return await this.db.album.findUnique({
      where: { id }
    });
  }

  async getAlbumWithDetails(id: string): Promise<AlbumWithDetails | null> {
    return await this.db.album.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { order: 'asc' }
        },
        slides: {
          orderBy: { order: 'asc' }
        },
        user: true
      }
    }) as AlbumWithDetails | null;
  }

  async getUserAlbums(userId: string): Promise<Album[]> {
    return await this.db.album.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateAlbum(id: string, albumData: Partial<Album>): Promise<Album> {
    return await this.db.album.update({
      where: { id },
      data: {
        ...albumData,
        updatedAt: new Date(),
      }
    });
  }

  async deleteAlbum(id: string): Promise<void> {
    // Delete related photos and slides first (cascade should handle this, but being explicit)
    await this.db.photo.deleteMany({
      where: { albumId: id }
    });
    
    await this.db.slide.deleteMany({
      where: { albumId: id }
    });

    await this.db.album.delete({
      where: { id }
    });
  }

  // Photo operations
  async createPhoto(photoData: {
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
  }): Promise<Photo> {
    return await this.db.photo.create({
      data: photoData
    });
  }

  async getAlbumPhotos(albumId: string): Promise<Photo[]> {
    return await this.db.photo.findMany({
      where: { albumId },
      orderBy: { order: 'asc' }
    });
  }

  async updatePhoto(id: string, photoData: Partial<Photo>): Promise<Photo> {
    return await this.db.photo.update({
      where: { id },
      data: photoData
    });
  }

  async deletePhoto(id: string): Promise<void> {
    await this.db.photo.delete({
      where: { id }
    });
  }

  // Slide operations
  async createSlide(slideData: {
    albumId: string;
    order?: number;
    layout?: string;
    photoPositions?: any;
  }): Promise<Slide> {
    return await this.db.slide.create({
      data: {
        albumId: slideData.albumId,
        order: slideData.order || 0,
        layout: slideData.layout || 'single',
        photoPositions: slideData.photoPositions || [],
      }
    });
  }

  async getAlbumSlides(albumId: string): Promise<Slide[]> {
    return await this.db.slide.findMany({
      where: { albumId },
      orderBy: { order: 'asc' }
    });
  }

  async updateSlide(id: string, slideData: Partial<Slide>): Promise<Slide> {
    return await this.db.slide.update({
      where: { id },
      data: {
        ...slideData,
        updatedAt: new Date(),
      }
    });
  }

  async deleteSlide(id: string): Promise<void> {
    await this.db.slide.delete({
      where: { id }
    });
  }

  // Album Job operations
  async createAlbumJob(jobData: {
    userId: string;
    type: string;
    status?: string;
    progress?: number;
    totalItems?: number;
    completedItems?: number;
    metadata?: any;
  }): Promise<AlbumJob> {
    return await this.db.albumJob.create({
      data: {
        userId: jobData.userId,
        type: jobData.type,
        status: jobData.status || 'pending',
        progress: jobData.progress || 0,
        totalItems: jobData.totalItems || 0,
        completedItems: jobData.completedItems || 0,
        metadata: jobData.metadata || {},
      }
    });
  }

  async getAlbumJob(id: string): Promise<AlbumJob | null> {
    return await this.db.albumJob.findUnique({
      where: { id }
    });
  }

  async updateAlbumJob(id: string, jobData: Partial<AlbumJob>): Promise<AlbumJob> {
    return await this.db.albumJob.update({
      where: { id },
      data: {
        ...jobData,
        updatedAt: new Date(),
      }
    });
  }

  // User settings (placeholder for future implementation)
  async getUserSettings(userId: string): Promise<any> {
    // For now, return default settings
    return {
      theme: 'light',
      notifications: true,
      autoSave: true,
    };
  }

  async updateUserSettings(userId: string, settings: any): Promise<any> {
    // For now, just return the settings
    // In the future, you might want to store these in a separate UserSettings table
    return settings;
  }
}

// Create and export a singleton instance
const storage = new Storage();
export default storage;