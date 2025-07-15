import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

// Rotas que requerem autenticação
const protectedRoutes = ['/dashboard', '/projects', '/photos', '/settings', '/profile']

// Rotas de autenticação (redirecionam se já logado)
const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Tentar pegar token do cookie
  const token = request.cookies.get('auth-token')?.value
  
  let isAuthenticated = false
  
  if (token) {
    try {
      await jwtVerify(token, secret)
      isAuthenticated = true
    } catch (error) {
      // Token inválido, remover cookie
      const response = NextResponse.next()
      response.cookies.delete('auth-token')
      isAuthenticated = false
    }
  }
  
  // Se está tentando acessar rota protegida sem estar autenticado
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Se está autenticado e tentando acessar rotas de auth, redirecionar para dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}