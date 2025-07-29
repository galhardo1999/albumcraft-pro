import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação inválido' },
        { status: 401 }
      )
    }

    const { id: eventId } = await context.params
    
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
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            _count: {
              select: {
                photos: true
              }
            },
            photos: {
              select: {
                id: true,
                filename: true,
                url: true
              },
              take: 3,
              orderBy: {
                uploadedAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!photoEvent) {
      return NextResponse.json(
        { success: false, error: 'Evento não encontrado ou acesso negado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: photoEvent
    })
  } catch (error) {
    console.error('Erro ao buscar evento de fotos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}