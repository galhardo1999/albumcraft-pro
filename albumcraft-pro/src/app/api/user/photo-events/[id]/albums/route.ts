import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET /api/user/photo-events/[id]/albums - Buscar álbuns de um evento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 })
    }

    const eventId = params.id

    // Verificar se o usuário tem acesso ao evento
    const photoEvent = await prisma.photoEvent.findFirst({
      where: {
        id: eventId,
        users: {
          some: {
            id: user.userId
          }
        }
      },
      include: {
        albums: {
          include: {
            _count: {
              select: {
                photos: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    })

    if (!photoEvent) {
      return NextResponse.json({ error: 'Evento não encontrado ou acesso negado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: photoEvent.albums
    })

  } catch (error) {
    console.error('Erro ao buscar álbuns do evento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}