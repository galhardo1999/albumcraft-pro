import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não autorizado'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    // Validações básicas
    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome e email são obrigatórios'
        },
        { status: 400 }
      )
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser && existingUser.id !== user.userId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Este email já está em uso'
          },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: {
      name: string;
      email: string;
      updatedAt: Date;
      password?: string;
    } = {
      name,
      email,
      updatedAt: new Date()
    }

    // Se uma nova senha foi fornecida, validar e atualizar
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Senha atual é obrigatória para alterar a senha'
          },
          { status: 400 }
        )
      }

      // Buscar usuário completo para verificar senha
      const fullUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { password: true }
      })

      if (!fullUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Usuário não encontrado'
          },
          { status: 404 }
        )
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, fullUser.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Senha atual incorreta'
          },
          { status: 400 }
        )
      }

      // Validar nova senha
      if (newPassword.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: 'A nova senha deve ter pelo menos 6 caracteres'
          },
          { status: 400 }
        )
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)
      updateData.password = hashedNewPassword
    }

    // Atualizar usuário no banco
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    })

  } catch (error: unknown) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}