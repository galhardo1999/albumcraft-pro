import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'
import { UpdateProjectSchema } from '@/lib/validations'

// GET /api/projects/[id] - Buscar projeto específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request)
  
  if (!user) {
    return createAuthResponse('Token de autenticação inválido ou expirado')
  }

  const params = await context.params

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.userId // Garantir que o usuário só acesse seus próprios projetos
      },
      include: {
        pages: {
          include: {
            photoPlacement: {
              include: {
                photo: true
              }
            },
            layout: true
          },
          orderBy: { pageNumber: 'asc' }
        },
        _count: {
          select: { pages: true }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Projeto não encontrado'
        }
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar projeto'
      }
    }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Atualizar projeto
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request)
  
  if (!user) {
    return createAuthResponse('Token de autenticação inválido ou expirado')
  }

  const params = await context.params

  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = UpdateProjectSchema.parse(body)
    
    // Verificar se o projeto existe e pertence ao usuário
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.userId
      }
    })
    
    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Projeto não encontrado'
        }
      }, { status: 404 })
    }
    
    // Atualizar projeto
    const settingsUpdate = validatedData.customWidth || validatedData.customHeight ? {
      ...(existingProject.settings as Record<string, unknown> || {}),
      customWidth: validatedData.customWidth,
      customHeight: validatedData.customHeight,
    } : existingProject.settings

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        settings: settingsUpdate as Prisma.InputJsonValue,
      },
      include: {
        _count: {
          select: { pages: true }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: project
    })
    
  } catch (error) {
    console.error('Update project error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
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
        message: 'Erro ao atualizar projeto'
      }
    }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Deletar projeto
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request)
  
  if (!user) {
    return createAuthResponse('Token de autenticação inválido ou expirado')
  }

  const params = await context.params

  try {
    // Verificar se o projeto existe e pertence ao usuário
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.userId
      }
    })
    
    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Projeto não encontrado'
        }
      }, { status: 404 })
    }
    
    // Deletar projeto (cascade irá deletar páginas e placements relacionados)
    await prisma.project.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({
      success: true,
      data: { message: 'Projeto deletado com sucesso' }
    })
    
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao deletar projeto'
      }
    }, { status: 500 })
  }
}