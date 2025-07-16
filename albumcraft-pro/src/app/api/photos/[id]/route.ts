import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação usando o middleware existente
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    const params = await context.params
    const photoId = params.id
    const body = await request.json()
    const { projectId } = body

    // Verificar se a foto existe e pertence ao usuário
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id: photoId,
        userId: user.userId
      }
    })

    if (!existingPhoto) {
      return NextResponse.json(
        { message: 'Foto não encontrada' },
        { status: 404 }
      )
    }

    // Se projectId foi fornecido, verificar se o projeto existe e pertence ao usuário
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.userId
        }
      })

      if (!project) {
        return NextResponse.json(
          { message: 'Projeto não encontrado' },
          { status: 404 }
        )
      }
    }

    // Atualizar a foto
    const updatedPhoto = await prisma.photo.update({
      where: {
        id: photoId
      },
      data: {
        projectId: projectId || null
      }
    })

    return NextResponse.json({
      message: 'Foto atualizada com sucesso',
      photo: updatedPhoto
    })

  } catch (error) {
    console.error('Erro ao atualizar foto:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}