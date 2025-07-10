import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAlbumSchema, insertPhotoSchema, insertSlideSchema } from "@shared/schema";
import { z } from "zod";

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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Album routes
  app.post("/api/albums", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const albumData = insertAlbumSchema.parse({ ...req.body, userId });
      
      const album = await storage.createAlbum(albumData);
      res.json(album);
    } catch (error) {
      console.error("Error creating album:", error);
      res.status(500).json({ message: "Failed to create album" });
    }
  });

  app.get("/api/albums", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const albums = await storage.getUserAlbums(userId);
      res.json(albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      res.status(500).json({ message: "Failed to fetch albums" });
    }
  });

  app.get("/api/albums/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put("/api/albums/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete("/api/albums/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post("/api/albums/:id/photos", isAuthenticated, upload.array("photos", 20), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        const photoData = insertPhotoSchema.parse({
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

  app.get("/api/albums/:id/photos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post("/api/albums/:id/slides", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const albumId = req.params.id;
      
      // Verify album ownership
      const album = await storage.getAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      if (album.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const slideData = insertSlideSchema.parse({ ...req.body, albumId });
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

  app.get("/api/albums/:id/slides", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put("/api/slides/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const slideId = req.params.id;
      
      // TODO: Verify slide ownership through album
      const updatedSlide = await storage.updateSlide(slideId, req.body);
      res.json(updatedSlide);
    } catch (error) {
      console.error("Error updating slide:", error);
      res.status(500).json({ message: "Failed to update slide" });
    }
  });

  // Static file serving for uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  const httpServer = createServer(app);
  return httpServer;
}
