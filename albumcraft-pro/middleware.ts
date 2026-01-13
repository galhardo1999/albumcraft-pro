import { NextRequest, NextResponse } from 'next/server'
import { getJWTSecret } from '@/core/auth/jwt'
import { jwtVerify } from 'jose'

// Rotas que requerem autenticação
const protectedRoutes = ['/dashboard', '/projects', '/photos', '/settings', '/profile', '/plans', '/admin']

// Rotas de autenticação (redirecionam se já logado)
const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']

// Rotas que requerem privilégios de admin
const adminRoutes = ['/admin']

async function verifyToken(token: string): Promise<{ isValid: boolean; payload?: any }> {
  try {
    const secret = getJWTSecret()
    const { payload } = await jwtVerify(token, secret)

    // Verificar se o token tem userId válido e não expirou
    const isValid = !!(payload.userId &&
      typeof payload.userId === 'string' &&
      payload.exp &&
      payload.exp * 1000 > Date.now())

    return { isValid, payload: isValid ? payload : undefined }
  } catch (error) {
    // Token inválido ou expirado
    return { isValid: false }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Se não é uma rota que precisa de verificação, continuar
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next()
  }

  // Obter token do cookie
  const token = request.cookies.get('auth-token')?.value

  // Verificar se o token é válido
  const tokenResult = token ? await verifyToken(token) : { isValid: false }
  const isAuthenticated = tokenResult.isValid

  // Se é uma rota protegida e não está autenticado
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    const response = NextResponse.redirect(loginUrl)

    // Remover cookie inválido se existir
    if (token) {
      response.cookies.set('auth-token', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }

    return response
  }

  // Se é uma rota de admin, verificar se o usuário é admin
  if (isAdminRoute && isAuthenticated && tokenResult.payload) {
    const isAdmin = tokenResult.payload.isAdmin === true

    if (!isAdmin) {
      // Redirecionar para dashboard se não for admin
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Se é uma rota de autenticação e está autenticado
  if (isAuthRoute && isAuthenticated) {
    // Verificar se é admin para redirecionar adequadamente
    const isAdmin = tokenResult.payload?.isAdmin === true
    const redirectUrl = new URL(isAdmin ? '/admin' : '/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}