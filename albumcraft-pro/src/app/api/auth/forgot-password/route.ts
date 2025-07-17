import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { ForgotPasswordSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = ForgotPasswordSchema.parse(body)
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    // Por segurança, sempre retornamos sucesso mesmo se o email não existir
    // Isso evita que atacantes descubram quais emails estão cadastrados
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um link de recuperação'
      })
    }
    
    // Gerar token de reset
    const resetToken = AuthService.generateSecureToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    
    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    })
    
    // TODO: Aqui você integraria com um serviço de email (SendGrid, Resend, etc.)
    // Por enquanto, vamos simular o envio do email
    console.log('Link de reset de senha gerado com sucesso')
    
    // Em produção, você enviaria um email como este:
    /*
    await sendEmail({
      to: user.email,
      subject: 'Redefinir senha - AlbumCraft Pro',
      html: `
        <h2>Redefinir sua senha</h2>
        <p>Olá ${user.name},</p>
        <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}">Redefinir senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
      `
    })
    */
    
    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link de recuperação'
    })
    
  } catch (error) {
    console.error('Erro ao processar solicitação de reset:', error)
    
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