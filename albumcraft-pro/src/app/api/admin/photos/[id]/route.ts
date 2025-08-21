import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

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
    const { albumId } = body

    console.log('🔄 PATCH /api/admin/photos/[id] - Parâmetros:', {
      adminUserId: user.userId,
      photoId,
      albumId
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

    // Se albumId foi fornecido, verificar se o projeto existe e pertence ao mesmo usuário da foto
    if (albumId) {
      const album = await prisma.album.findFirst({
        where: {
          id: albumId,
          userId: existingPhoto.userId
        }
      })

      if (!album) {
        return NextResponse.json({
          success: false,
          error: 'Álbum não encontrado ou não pertence ao usuário da foto'
        }, { status: 404 })
      }
    }

    // Atualizar a foto
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        albumId: albumId || null
      },
      select: {
        id: true,
        filename: true,
        s3Url: true,
        width: true,
        height: true,
        size: true,
        albumId: true,
        userId: true,
        createdAt: true,
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
      data: { ...updatedPhoto, url: updatedPhoto.s3Url },
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