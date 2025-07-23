import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token de autenticação inválido ou expirado'
          }
        },
        { status: 401 }
      )
    }

    // Buscar dados completos do usuário
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        isAdmin: true,
        createdAt: true,
        lastLogin: true
      }
    })

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuário não encontrado'
          }
        },
        { status: 404 }
      )
    }

    // Atualizar último login
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { lastLogin: new Date() },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        isAdmin: true,
        createdAt: true,
        lastLogin: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser
      }
    })

  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao verificar autenticação'
        }
      },
      { status: 500 }
    )
  }
}