import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Rotas que requerem autenticação
const protectedRoutes = ['/dashboard', '/projects', '/photos', '/settings', '/profile', '/plans']

// Rotas de autenticação (redirecionam se já logado)
const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']

async function verifyToken(token: string): Promise<boolean> {
  try {
    const jwtSecret = process.env.NEXTAUTH_SECRET
    
    if (!jwtSecret) {
      console.error('NEXTAUTH_SECRET não configurado')
      return false
    }
    
    const secret = new TextEncoder().encode(jwtSecret)
    const { payload } = await jwtVerify(token, secret)
    
    // Verificar se o token tem userId válido e não expirou
    return !!(payload.userId && 
             typeof payload.userId === 'string' && 
             payload.exp && 
             payload.exp * 1000 > Date.now())
  } catch (error) {
    // Token inválido ou expirado
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Se não é uma rota que precisa de verificação, continuar
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next()
  }
  
  // Obter token do cookie
  const token = request.cookies.get('auth-token')?.value
  
  // Verificar se o token é válido
  const isAuthenticated = token ? await verifyToken(token) : false
  
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
  
  // Se é uma rota de autenticação e está autenticado
  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
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