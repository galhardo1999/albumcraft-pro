# Album Builder

## Overview

Album Builder is a modern web application for creating, editing, and exporting professional photo albums. The application provides a full-featured digital album creation experience with drag-and-drop editing, multiple layout templates, and high-quality export capabilities. It's designed for photographers, creative professionals, and anyone who wants to create beautiful photo albums.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **UI Library**: Radix UI primitives with custom styling
- **Drag & Drop**: @dnd-kit for photo and slide manipulation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Handling**: Multer for photo uploads
- **API Design**: RESTful API endpoints

## Key Components

### Authentication System
- **Provider**: Replit Auth integration using OpenID Connect
- **Session Storage**: PostgreSQL-backed session store
- **User Management**: User profiles with subscription tiers (FREE, PRO, PREMIUM)
- **Authorization**: Route-level authentication middleware

### Album Management
- **Creation**: Individual album creation with metadata (name, size, orientation)
- **Storage**: Albums linked to user accounts with status tracking
- **Templates**: Multiple layout templates for different album styles
- **Organization**: Photo and slide management within albums

### Photo Processing
- **Upload**: Drag-and-drop file upload with validation
- **Storage**: File system storage with metadata tracking
- **Formats**: Support for JPEG, PNG, and WebP formats
- **Constraints**: 10MB file size limit, image type validation

### Editor Interface
- **Gallery View**: Photo library with drag-and-drop organization
- **Slide Editor**: Layout-based slide creation and editing
- **Preview Mode**: Real-time album preview functionality
- **Navigation**: Slide-by-slide editing interface

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Album Creation**: Users create albums with metadata, stored in database
3. **Photo Upload**: Images uploaded to file system, metadata stored in database
4. **Slide Creation**: Users arrange photos in layout templates, slide data stored
5. **Export Processing**: Albums exported to various formats (PDF, image archives)

## External Dependencies

### Database
- **Primary**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management

### Authentication
- **Provider**: Replit Auth with OpenID Connect
- **Session**: PostgreSQL session store
- **Security**: HTTPS-only cookies, secure session management

### File Storage
- **Method**: Local file system storage
- **Processing**: Multer for upload handling
- **Validation**: File type and size constraints

### UI Components
- **Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React icons
- **Interactions**: DND Kit for drag-and-drop functionality

## Deployment Strategy

### Development
- **Server**: Vite development server with HMR
- **Database**: Neon Database connection
- **Environment**: TypeScript with strict type checking

### Production
- **Build**: Vite production build with static asset optimization
- **Server**: Express.js serving built assets and API
- **Database**: PostgreSQL with connection pooling
- **Assets**: Static file serving from dist/public directory

### Configuration
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS
- **Build Process**: TypeScript compilation and Vite bundling
- **Asset Handling**: Tailwind CSS processing and optimization

The application follows a clear separation between client and server code, with shared TypeScript types and schemas. The architecture supports both development and production environments with appropriate tooling and optimization strategies.