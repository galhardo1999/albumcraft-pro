import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: varchar("plan").notNull().default("FREE"), // FREE, PRO, PREMIUM
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Albums table
export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  size: varchar("size").notNull().default("A4"), // A4, A3, Letter, Square
  orientation: varchar("orientation").notNull().default("Landscape"), // Landscape, Portrait, Square
  status: varchar("status").notNull().default("draft"), // draft, completed, exported
  photoCount: integer("photo_count").notNull().default(0),
  slideCount: integer("slide_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Photos table
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull().references(() => albums.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  url: varchar("url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Slides table
export const slides = pgTable("slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull().references(() => albums.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  layout: varchar("layout").notNull().default("single"), // single, double, triple, quad, grid
  photoPositions: jsonb("photo_positions").notNull().default("[]"), // Array of photo IDs with positions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Album jobs table for tracking bulk operations
export const albumJobs = pgTable("album_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // create_multiple, export_batch
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").notNull().default(0),
  totalItems: integer("total_items").notNull().default(0),
  completedItems: integer("completed_items").notNull().default(0),
  metadata: jsonb("metadata").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  albums: many(albums),
  albumJobs: many(albumJobs),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  user: one(users, {
    fields: [albums.userId],
    references: [users.id],
  }),
  photos: many(photos),
  slides: many(slides),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  album: one(albums, {
    fields: [photos.albumId],
    references: [albums.id],
  }),
}));

export const slidesRelations = relations(slides, ({ one }) => ({
  album: one(albums, {
    fields: [slides.albumId],
    references: [albums.id],
  }),
}));

export const albumJobsRelations = relations(albumJobs, ({ one }) => ({
  user: one(users, {
    fields: [albumJobs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const insertSlideSchema = createInsertSchema(slides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlbumJobSchema = createInsertSchema(albumJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Album = typeof albums.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type Slide = typeof slides.$inferSelect;
export type InsertAlbumJob = z.infer<typeof insertAlbumJobSchema>;
export type AlbumJob = typeof albumJobs.$inferSelect;

// Extended types for API responses
export type AlbumWithDetails = Album & {
  photos: Photo[];
  slides: Slide[];
  user: User;
};

export type SlideWithPhotos = Slide & {
  photos: Photo[];
};
