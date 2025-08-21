import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { CreateUserSchema } from '@/lib/validations'
import { createJWTToken } from '@/lib/jwt-config'
import { setAuthCookie } from '@/lib/cookie-config'
import { rateLimit, rateLimitConfigs, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

const registerRateLimit = rateLimit(rateLimitConfigs.auth)

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = await registerRateLimit(request)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!)
    }

    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = CreateUserSchema.parse(body)
    
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Usuário já existe com este email'
        }
      }, { status: 400 })
    }
    
    // Hash da senha
    const passwordHash = await AuthService.hashPassword(validatedData.password)
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        name: validatedData.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
      }
    })
    
    // Gerar JWT token
    const token = await createJWTToken({ 
      userId: user.id, 
      email: user.email,
      plan: user.plan,
      isAdmin: false
    }, '7d')
    
    const response = NextResponse.json({
      success: true,
      data: {
        user
      }
    }, { status: 201 })
    
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
    console.error('Register error:', error)
    
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