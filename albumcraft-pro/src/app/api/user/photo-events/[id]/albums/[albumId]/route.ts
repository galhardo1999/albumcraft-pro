import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET /api/user/photo-events/[id]/albums/[albumId] - Buscar fotos de um álbum específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; albumId: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 })
    }

    const eventId = params.id
    const albumId = params.albumId

    // Verificar se o usuário tem acesso ao evento e álbum
    const album = await prisma.photoAlbum.findFirst({
      where: {
        id: albumId,
        eventId: eventId,
        event: {
          users: {
            some: {
              id: user.userId
            }
          }
        }
      },
      include: {
        photos: {
          select: {
            id: true,
            filename: true,
            url: true,
            uploadedAt: true,
            size: true
          },
          orderBy: {
            uploadedAt: 'asc'
          }
        },
        event: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Álbum não encontrado ou acesso negado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: album
    })

  } catch (error) {
    console.error('Erro ao buscar fotos do álbum:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}