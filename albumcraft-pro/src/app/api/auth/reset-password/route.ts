import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { ResetPasswordSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = ResetPasswordSchema.parse(body)
    
    // Buscar usuário com o token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: validatedData.token,
        resetPasswordExpires: {
          gt: new Date() // Token ainda não expirou
        }
      }
    })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token inválido ou expirado'
        }
      }, { status: 400 })
    }
    
    // Hash da nova senha
    const hashedPassword = await AuthService.hashPassword(validatedData.password)
    
    // Atualizar senha e limpar token de reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    
    if (error instanceof z.ZodError) {
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
        message: 'Erro interno do servidor'
      }
    }, { status: 500 })
  }
}