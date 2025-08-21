import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { createJWTToken } from '@/lib/jwt-config'
import { setAuthCookie } from '@/lib/cookie-config'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
)

const googleCallbackRateLimit = rateLimit(rateLimitConfigs.oauth)

// GET /api/auth/google/callback - Callback do Google OAuth
export async function GET(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = await googleCallbackRateLimit(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=rate_limit_exceeded`)
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('Erro do Google OAuth:', error)
      const errorParam = searchParams.get('error_description') || error
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=google_oauth_error&details=${encodeURIComponent(errorParam)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=missing_code`)
    }

    // Trocar código por tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Obter informações do usuário
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=invalid_token`)
    }

    const { email, name, picture } = payload

    if (!email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=missing_email`)
    }

    // Verificar se o usuário já existe
    let user = await prisma.user.findUnique({
      where: { email }
    })

    // Se não existe, criar novo usuário
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash: '', // Usuários do Google não precisam de senha
          avatarUrl: picture || null,
          lastLogin: new Date()
        }
      })
    } else {
      // Atualizar último login e avatar se necessário
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          ...(picture && { avatarUrl: picture })
        }
      })
    }

    // Gerar JWT token
    const token = await createJWTToken({ 
      userId: user.id,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin
    }, '7d')

    // Redirecionar baseado no tipo de usuário
    const redirectUrl = user.isAdmin ? '/admin' : '/dashboard'
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}${redirectUrl}`)

    // Definir cookie de autenticação
    setAuthCookie(response, token)

    return response
  } catch (error) {
    console.error('Erro no callback do Google OAuth:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=server_error`)
  }
}