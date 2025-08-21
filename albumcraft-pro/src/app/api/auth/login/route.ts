import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { LoginSchema } from '@/lib/validations'
import { createJWTToken } from '@/lib/jwt-config'
import { setAuthCookie } from '@/lib/cookie-config'
import { rateLimit, rateLimitConfigs, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

const loginRateLimit = rateLimit(rateLimitConfigs.auth)

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = await loginRateLimit(request)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!)
    }

    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = LoginSchema.parse(body)
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou senha inválidos'
        }
      }, { status: 401 })
    }
    
    // Verificar senha
    const isValidPassword = await AuthService.verifyPassword(
      validatedData.password,
      user.passwordHash
    )
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou senha inválidos'
        }
      }, { status: 401 })
    }
    
    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })
    
    // Gerar JWT token
    const token = await createJWTToken({ 
      userId: user.id, 
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin
    }, '7d')
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin
        }
      }
    })
    
    // Set secure cookie
    setAuthCookie(response, token)
    
    // Adicionar headers de rate limit
    return addRateLimitHeaders(
      response,
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      rateLimitConfigs.auth.maxRequests
    )
    
  } catch (error) {
    console.error('Login error:', error)
    
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
        message: 'Erro interno do servidor'
      }
    }, { status: 500 })
  }
}