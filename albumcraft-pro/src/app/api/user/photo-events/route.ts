import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação inválido' },
        { status: 401 }
      )
    }
    
    // Buscar eventos de fotos associados ao usuário
    const photoEvents = await prisma.photoEvent.findMany({
      where: {
        users: {
          some: {
            id: user.userId
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            albums: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: photoEvents
    })
  } catch (error) {
    console.error('Erro ao buscar eventos de fotos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}