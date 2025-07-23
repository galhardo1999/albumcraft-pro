import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'

const prisma = new PrismaClient()

// PATCH - Atualizar foto (admin pode atualizar fotos de qualquer usuário)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticar usuário
    const user = await authenticateRequest(request)
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    // Verificar se é admin
    const adminUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' },
        { status: 403 }
      )
    }

    const params = await context.params;
    const photoId = params.id
    const body = await request.json()
    const { projectId } = body

    console.log('🔄 PATCH /api/admin/photos/[id] - Parâmetros:', {
      adminUserId: user.userId,
      photoId,
      projectId
    })

    // Verificar se a foto existe
    const existingPhoto = await prisma.photo.findUnique({
      where: { id: photoId }
    })

    if (!existingPhoto) {
      return NextResponse.json({
        success: false,
        error: 'Foto não encontrada'
      }, { status: 404 })
    }

    // Se projectId foi fornecido, verificar se o projeto existe e pertence ao mesmo usuário da foto
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: existingPhoto.userId
        }
      })

      if (!project) {
        return NextResponse.json({
          success: false,
          error: 'Projeto não encontrado ou não pertence ao usuário da foto'
        }, { status: 404 })
      }
    }

    // Atualizar a foto
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        projectId: projectId || null
      },
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        thumbnailUrl: true,
        mediumUrl: true,
        width: true,
        height: true,
        fileSize: true,
        projectId: true,
        userId: true,
        uploadedAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log('✅ Foto atualizada com sucesso')

    return NextResponse.json({
      success: true,
      data: updatedPhoto,
      message: 'Foto atualizada com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar foto:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Deletar foto (admin pode deletar fotos de qualquer usuário)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticar usuário
    const user = await authenticateRequest(request)
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    // Verificar se é admin
    const adminUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' },
        { status: 403 }
      )
    }

    const params = await context.params;
    const photoId = params.id

    console.log('🗑️ DELETE /api/admin/photos/[id] - Parâmetros:', {
      adminUserId: user.userId,
      photoId
    })

    // Verificar se a foto existe
    const existingPhoto = await prisma.photo.findUnique({
      where: { id: photoId }
    })

    if (!existingPhoto) {
      return NextResponse.json({
        success: false,
        error: 'Foto não encontrada'
      }, { status: 404 })
    }

    // Deletar a foto
    await prisma.photo.delete({
      where: { id: photoId }
    })

    console.log('✅ Foto deletada com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Foto deletada com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao deletar foto:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}