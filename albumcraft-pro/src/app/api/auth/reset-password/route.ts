import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { ResetPasswordSchema } from '@/lib/validations'
import { z } from 'zod'
import { rateLimit, rateLimitConfigs, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

const resetPasswordRateLimit = rateLimit(rateLimitConfigs.passwordReset)

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = await resetPasswordRateLimit(request)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!)
    }

    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = ResetPasswordSchema.parse(body)
    
    // Hash do token recebido para comparação segura
    const hashedToken = AuthService.hashResetToken(validatedData.token)
    
    // Buscar usuário com o hash do token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
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
    
    const response = NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    })
    
    // Adicionar headers de rate limit
    return addRateLimitHeaders(
      response,
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      rateLimitConfigs.passwordReset.maxRequests
    )
    
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