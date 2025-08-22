import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { CreateAlbumSchema } from '@/lib/validations'

// GET /api/albums - Listar álbuns do usuário
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where: { userId: user.userId },
        include: {
          pages: {
            select: { id: true }
          },
          photos: {
            select: { id: true, filename: true, s3Url: true },
            take: 3
          },
          _count: {
            select: { pages: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.album.count({
        where: { userId: user.userId }
      })
    ])

    // Normalizar: adicionar alias url -> s3Url e thumbnailUrl nas fotos dos álbuns
    const normalizedAlbums = albums.map(a => ({
      ...a,
      photos: (a.photos || []).map(p => ({ 
        ...p, 
        url: p.s3Url,
        thumbnailUrl: p.s3Url // Por enquanto usando a mesma URL, pode ser otimizado depois
      }))
    }))
    
    return NextResponse.json({
      success: true,
      data: normalizedAlbums,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get albums error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar álbuns'
      }
    }, { status: 500 })
  }
})

// POST /api/albums - Criar novo álbum
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = CreateAlbumSchema.parse(body)
    
    // Verificar limites do plano
    if (user.plan === 'FREE') {
      const albumCount = await prisma.album.count({
        where: { userId: user.userId }
      })
      
      if (albumCount >= 3) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'PLAN_LIMIT_EXCEEDED',
            message: 'Limite de álbuns atingido para o plano gratuito'
          }
        }, { status: 403 })
      }
    }
    
    // Criar álbum
    const album = await prisma.album.create({
      data: {
        userId: user.userId,
        name: validatedData.name,
        description: validatedData.description,
        albumSize: validatedData.albumSize,
        status: validatedData.status || 'DRAFT',
        creationType: validatedData.creationType || 'SINGLE',
        group: validatedData.group,
        settings: {
          customWidth: validatedData.customWidth,
          customHeight: validatedData.customHeight,
        }
      },
      include: {
        _count: {
          select: { pages: true }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      album: album
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create album error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error
        }
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao criar álbum'
      }
    }, { status: 500 })
  }
})