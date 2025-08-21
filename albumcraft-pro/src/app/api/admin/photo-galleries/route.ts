import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// GET /api/admin/photo-galleries - Listar todas as fotos da galeria
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const albumId = searchParams.get('albumId')
    const eventId = searchParams.get('eventId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Prisma.PhotoGalleryWhereInput = {}

    if (albumId) {
      where.albumId = albumId
    }

    if (eventId) {
      where.album = {
        eventId: eventId
      }
    }

    if (search) {
      where.filename = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Buscar fotos com paginação
    const [photos, total] = await Promise.all([
      prisma.photoGallery.findMany({
        where,
        include: {
          album: {
            include: {
              event: true,
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.photoGallery.count({ where }),
    ])

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar fotos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}