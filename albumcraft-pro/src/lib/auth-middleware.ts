import { NextRequest, NextResponse } from 'next/server'
import { getJWTSecret } from './jwt-config'
import { jwtVerify } from 'jose'

export interface AuthenticatedUser {
  userId: string
  email: string
  plan: string
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Tentar pegar token do cookie primeiro
    let token = request.cookies.get('auth-token')?.value
    
    // Se não encontrar no cookie, tentar no header Authorization
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return null
    }
    
    // Verificar e decodificar o JWT
    const secret = getJWTSecret()
    const { payload } = await jwtVerify(token, secret)
    
    const user = {
      userId: payload.userId as string,
      email: payload.email as string,
      plan: payload.plan as string,
    }
    
    return user
  } catch (error) {
    console.error('Erro de autenticação:', error)
    return null
  }
}

export function createAuthResponse(message: string, status: number = 401) {
  return NextResponse.json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message
    }
  }, { status })
}

export function withAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }
    
    return handler(request, user)
  }
}

export function withAuthParams<T = Record<string, unknown>>(handler: (request: NextRequest, user: AuthenticatedUser, context: T) => Promise<NextResponse>) {
  return async (request: NextRequest, context: T) => {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }
    
    return handler(request, user, context)
  }
}