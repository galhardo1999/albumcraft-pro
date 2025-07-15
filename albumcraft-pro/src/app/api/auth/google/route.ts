import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
)

// GET /api/auth/google - Redirecionar para Google OAuth
export async function GET() {
  try {
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Erro ao gerar URL do Google OAuth:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/auth/google - Processar callback do Google
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de autorização não fornecido' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 400 }
      )
    }

    const { email, name, picture } = payload

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email não fornecido pelo Google' },
        { status: 400 }
      )
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
          avatar: picture || null,
          lastLogin: new Date()
        }
      })
    } else {
      // Atualizar último login e avatar se necessário
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          ...(picture && { avatar: picture })
        }
      })
    }

    // Gerar JWT token
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    })

    // Definir cookie de autenticação
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    })

    return response
  } catch (error) {
    console.error('Erro no login com Google:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}