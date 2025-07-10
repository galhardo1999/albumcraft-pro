import {
  users,
  albums,
  photos,
  slides,
  albumJobs,
  type User,
  type UpsertUser,
  type Album,
  type InsertAlbum,
  type Photo,
  type InsertPhoto,
  type Slide,
  type InsertSlide,
  type AlbumJob,
  type InsertAlbumJob,
  type AlbumWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Album operations
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbum(id: string): Promise<Album | undefined>;
  getAlbumWithDetails(id: string): Promise<AlbumWithDetails | undefined>;
  getUserAlbums(userId: string): Promise<Album[]>;
  updateAlbum(id: string, updates: Partial<Album>): Promise<Album>;
  deleteAlbum(id: string): Promise<void>;
  
  // Photo operations
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  getAlbumPhotos(albumId: string): Promise<Photo[]>;
  updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo>;
  deletePhoto(id: string): Promise<void>;
  
  // Slide operations
  createSlide(slide: InsertSlide): Promise<Slide>;
  getAlbumSlides(albumId: string): Promise<Slide[]>;
  updateSlide(id: string, updates: Partial<Slide>): Promise<Slide>;
  deleteSlide(id: string): Promise<void>;
  
  // Album job operations
  createAlbumJob(job: InsertAlbumJob): Promise<AlbumJob>;
  getAlbumJob(id: string): Promise<AlbumJob | undefined>;
  getUserAlbumJobs(userId: string): Promise<AlbumJob[]>;
  updateAlbumJob(id: string, updates: Partial<AlbumJob>): Promise<AlbumJob>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Album operations
  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [newAlbum] = await db.insert(albums).values(album).returning();
    return newAlbum;
  }

  async getAlbum(id: string): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }

  async getAlbumWithDetails(id: string): Promise<AlbumWithDetails | undefined> {
    const [album] = await db
      .select()
      .from(albums)
      .leftJoin(users, eq(albums.userId, users.id))
      .where(eq(albums.id, id));

    if (!album.albums) return undefined;

    const albumPhotos = await this.getAlbumPhotos(id);
    const albumSlides = await this.getAlbumSlides(id);

    return {
      ...album.albums,
      photos: albumPhotos,
      slides: albumSlides,
      user: album.users!,
    };
  }

  async getUserAlbums(userId: string): Promise<Album[]> {
    return await db
      .select()
      .from(albums)
      .where(eq(albums.userId, userId))
      .orderBy(desc(albums.createdAt));
  }

  async updateAlbum(id: string, updates: Partial<Album>): Promise<Album> {
    const [updatedAlbum] = await db
      .update(albums)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(albums.id, id))
      .returning();
    return updatedAlbum;
  }

  async deleteAlbum(id: string): Promise<void> {
    await db.delete(albums).where(eq(albums.id, id));
  }

  // Photo operations
  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }

  async getAlbumPhotos(albumId: string): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.albumId, albumId))
      .orderBy(asc(photos.order));
  }

  async updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo> {
    const [updatedPhoto] = await db
      .update(photos)
      .set(updates)
      .where(eq(photos.id, id))
      .returning();
    return updatedPhoto;
  }

  async deletePhoto(id: string): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  // Slide operations
  async createSlide(slide: InsertSlide): Promise<Slide> {
    const [newSlide] = await db.insert(slides).values(slide).returning();
    return newSlide;
  }

  async getAlbumSlides(albumId: string): Promise<Slide[]> {
    return await db
      .select()
      .from(slides)
      .where(eq(slides.albumId, albumId))
      .orderBy(asc(slides.order));
  }

  async updateSlide(id: string, updates: Partial<Slide>): Promise<Slide> {
    const [updatedSlide] = await db
      .update(slides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(slides.id, id))
      .returning();
    return updatedSlide;
  }

  async deleteSlide(id: string): Promise<void> {
    await db.delete(slides).where(eq(slides.id, id));
  }

  // Album job operations
  async createAlbumJob(job: InsertAlbumJob): Promise<AlbumJob> {
    const [newJob] = await db.insert(albumJobs).values(job).returning();
    return newJob;
  }

  async getAlbumJob(id: string): Promise<AlbumJob | undefined> {
    const [job] = await db.select().from(albumJobs).where(eq(albumJobs.id, id));
    return job;
  }

  async getUserAlbumJobs(userId: string): Promise<AlbumJob[]> {
    return await db
      .select()
      .from(albumJobs)
      .where(eq(albumJobs.userId, userId))
      .orderBy(desc(albumJobs.createdAt));
  }

  async updateAlbumJob(id: string, updates: Partial<AlbumJob>): Promise<AlbumJob> {
    const [updatedJob] = await db
      .update(albumJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(albumJobs.id, id))
      .returning();
    return updatedJob;
  }
}

export const storage = new DatabaseStorage();
