import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import storage from "./storage-prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Validation schemas for Prisma
const createAlbumSchema = z.object({
  name: z.string().min(1, "Album name is required"),
  size: z.string().optional().default("A4"),
  orientation: z.string().optional().default("Landscape"),
  status: z.string().optional().default("draft"),
});

const createPhotoSchema = z.object({
  albumId: z.string(),
  filename: z.string(),
  originalName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  width: z.number(),
  height: z.number(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  order: z.number().optional().default(0),
});

const createSlideSchema = z.object({
  albumId: z.string(),
  order: z.number().optional().default(0),
  layout: z.string().optional().default("single"),
  photoPositions: z.any().optional().default([]),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Middleware to check authentication
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    req.user = session.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and WEBP are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Registration route (public)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await storage.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        plan: "free",
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({ 
        message: "User created successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Error creating user:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Auth routes
  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }
      
      const updatedUser = await storage.updateUser(userId, { firstName, lastName });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Delete all user albums and photos first
      const albums = await storage.getUserAlbums(userId);
      for (const album of albums) {
        await storage.deleteAlbum(album.id);
      }
      
      // Delete user
      await storage.deleteUser(userId);
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // User settings routes
  app.get("/api/user/settings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/user/settings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = req.body;
      
      const updatedSettings = await storage.updateUserSettings(userId, settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Album routes
  app.post("/api/albums", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albumData = createAlbumSchema.parse(req.body);
      
      const album = await storage.createAlbum({ ...albumData, userId });
      res.json(album);
    } catch (error) {
      console.error("Error creating album:", error);
      res.status(500).json({ message: "Failed to create album" });
    }
  });

  app.get("/api/albums", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albums = await storage.getUserAlbums(userId);
      res.json(albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      res.status(500).json({ message: "Failed to fetch albums" });
    }
  });

  app.get("/api/albums/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const album = await storage.getAlbumWithDetails(req.params.id);
      
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(album);
    } catch (error) {
      console.error("Error fetching album:", error);
      res.status(500).json({ message: "Failed to fetch album" });
    }
  });

  app.put("/api/albums/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const album = await storage.getAlbum(req.params.id);
      
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedAlbum = await storage.updateAlbum(req.params.id, req.body);
      res.json(updatedAlbum);
    } catch (error) {
      console.error("Error updating album:", error);
      res.status(500).json({ message: "Failed to update album" });
    }
  });

  app.delete("/api/albums/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const album = await storage.getAlbum(req.params.id);
      
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteAlbum(req.params.id);
      res.json({ message: "Album deleted successfully" });
    } catch (error) {
      console.error("Error deleting album:", error);
      res.status(500).json({ message: "Failed to delete album" });
    }
  });

  // Photo upload routes
  app.post("/api/albums/:id/photos", requireAuth, upload.array("photos", 20), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albumId = req.params.id;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      // Verify album ownership
      const album = await storage.getAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const photos = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const photoData = createPhotoSchema.parse({
          albumId,
          filename: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          width: 1920, // TODO: Get actual dimensions
          height: 1080, // TODO: Get actual dimensions
          url: `/uploads/${file.filename}`,
          order: i,
        });
        
        const photo = await storage.createPhoto(photoData);
        photos.push(photo);
      }
      
      // Update album photo count
      await storage.updateAlbum(albumId, { 
        photoCount: album.photoCount + photos.length 
      });
      
      res.json(photos);
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ message: "Failed to upload photos" });
    }
  });

  app.get("/api/albums/:id/photos", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albumId = req.params.id;
      
      // Verify album ownership
      const album = await storage.getAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const photos = await storage.getAlbumPhotos(albumId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Slide routes
  app.post("/api/albums/:id/slides", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albumId = req.params.id;
      
      // Verify album ownership
      const album = await storage.getAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const slideData = createSlideSchema.parse({ ...req.body, albumId });
      const slide = await storage.createSlide(slideData);
      
      // Update album slide count
      await storage.updateAlbum(albumId, { 
        slideCount: album.slideCount + 1 
      });
      
      res.json(slide);
    } catch (error) {
      console.error("Error creating slide:", error);
      res.status(500).json({ message: "Failed to create slide" });
    }
  });

  app.get("/api/albums/:id/slides", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albumId = req.params.id;
      
      // Verify album ownership
      const album = await storage.getAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const slides = await storage.getAlbumSlides(albumId);
      res.json(slides);
    } catch (error) {
      console.error("Error fetching slides:", error);
      res.status(500).json({ message: "Failed to fetch slides" });
    }
  });

  app.put("/api/slides/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const slideId = req.params.id;
      
      // TODO: Verify slide ownership through album
      const updatedSlide = await storage.updateSlide(slideId, req.body);
      res.json(updatedSlide);
    } catch (error) {
      console.error("Error updating slide:", error);
      res.status(500).json({ message: "Failed to update slide" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albums = await storage.getUserAlbums(userId);
      
      const stats = {
        totalAlbums: albums.length,
        photosUsed: albums.reduce((sum: number, album: any) => sum + (album.photoCount || 0), 0),
        exports: 0, // TODO: Track exports
        storageUsed: 0, // TODO: Calculate storage usage
        storageLimit: 10 // TODO: Get from user plan
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Album export route
  app.post("/api/albums/:id/export", requireAuth, async (req: any, res) => {
    try {
      const albumId = req.params.id;
      const userId = req.user.id;
      const { format = "jpg", quality = "72" } = req.body;

      // Verify album ownership
      const album = await storage.getAlbum(albumId);
      if (!album || album.userId !== userId) {
        return res.status(404).json({ message: "Album not found" });
      }

      // Get album photos
      const photos = await storage.getAlbumPhotos(albumId);
      
      if (photos.length === 0) {
        return res.status(400).json({ message: "No photos to export" });
      }

      // For now, return a simple response indicating export would happen
      // In a real implementation, you would generate the actual export file
      res.json({ 
        message: "Export initiated", 
        albumId, 
        format, 
        quality,
        photoCount: photos.length 
      });
    } catch (error) {
      console.error("Error exporting album:", error);
      res.status(500).json({ message: "Failed to export album" });
    }
  });

  // Static file serving for uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  const httpServer = createServer(app);
  return httpServer;
}
