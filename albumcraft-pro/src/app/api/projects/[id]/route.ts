import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'
import { UpdateProjectSchema } from '@/lib/validations'
import { deleteProjectFiles, isS3Configured } from '@/lib/s3'

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
      },
      include: {
        photos: {
          where: {
            isS3Stored: true // Apenas fotos armazenadas no S3
          }
        }
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

    // Lista para armazenar erros de exclusão do S3 (não críticos)
    let s3DeletionResult = null

    // Deletar arquivos do S3 se configurado
    if (isS3Configured() && existingProject.photos.length > 0) {
      console.log(`Iniciando exclusão de ${existingProject.photos.length} fotos do S3`)
      
      try {
        s3DeletionResult = await deleteProjectFiles(existingProject.photos)
        console.log(`Exclusão do S3 concluída: ${s3DeletionResult.summary.successCount} arquivos deletados, ${s3DeletionResult.summary.errorCount} erros`)
      } catch (error) {
        console.error('Erro geral na exclusão do S3:', error)
        s3DeletionResult = {
          totalPhotos: existingProject.photos.length,
          deletedFiles: [],
          errors: [{ key: 'general', error: error instanceof Error ? error.message : 'Erro desconhecido' }],
          summary: { successCount: 0, errorCount: 1, skippedCount: 0 }
        }
      }
    } else if (!isS3Configured()) {
      console.log('S3 não configurado, pulando exclusão de arquivos')
    } else {
      console.log('Nenhuma foto encontrada para exclusão no S3')
    }
    
    // Deletar projeto (cascade irá deletar páginas e placements relacionados)
    await prisma.project.delete({
      where: { id: params.id }
    })

    console.log(`Projeto deletado com sucesso`)
    
    // Retornar resposta com informações sobre exclusões do S3
    const response: {
      success: boolean;
      data: {
        message: string;
        totalPhotos: number;
        s3Deletion?: {
          totalFiles?: number;
          successCount?: number;
          errorCount?: number;
          skippedCount?: number;
          message?: string;
          totalPhotos?: number;
        };
        s3Warnings?: {
          message: string;
          errors: Array<{ key: string; error: string }>;
          count: number;
        };
      };
    } = {
      success: true,
      data: { 
        message: 'Projeto deletado com sucesso',
        totalPhotos: existingProject.photos.length
      }
    }

    // Incluir informações detalhadas sobre a exclusão do S3
    if (s3DeletionResult) {
      response.data.s3Deletion = {
        totalFiles: s3DeletionResult.deletedFiles.length,
        successCount: s3DeletionResult.summary.successCount,
        errorCount: s3DeletionResult.summary.errorCount,
        skippedCount: s3DeletionResult.summary.skippedCount
      }

      // Incluir avisos sobre erros do S3 se houver (não críticos)
      if (s3DeletionResult.summary.errorCount > 0) {
        response.data.s3Warnings = {
          message: 'Projeto deletado, mas alguns arquivos do S3 não puderam ser removidos',
          errors: s3DeletionResult.errors,
          count: s3DeletionResult.summary.errorCount
        }
      }
    } else if (existingProject.photos.length > 0) {
      response.data.s3Deletion = {
        message: 'S3 não configurado - arquivos não foram removidos do armazenamento',
        totalPhotos: existingProject.photos.length
      }
    }
    
    return NextResponse.json(response)
    
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