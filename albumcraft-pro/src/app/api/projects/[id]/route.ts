import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'
import { UpdateProjectSchema } from '@/lib/validations'
import { deletePhotoVariants, isS3Configured } from '@/lib/s3'

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
  try {
    // ✅ Verificar autenticação
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    const params = await context.params
    const projectId = params.id

    console.log(`🗑️ Iniciando exclusão do projeto: ${projectId} para usuário: ${user.userId}`)

    // ✅ Verificar se o projeto existe e pertence ao usuário
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.userId
      },
      include: {
        photos: {
          select: {
            id: true,
            filename: true,
            s3Key: true,
            isS3Stored: true,
            originalUrl: true
          }
        }
      }
    })

    if (!existingProject) {
      console.log(`❌ Projeto não encontrado: ${projectId}`)
      return NextResponse.json(
        { message: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    console.log(`📂 Projeto encontrado:`, {
      id: existingProject.id,
      name: existingProject.name,
      photosCount: existingProject.photos.length
    })

    // ✅ Preparar resultado da exclusão
    const deletionResult = {
      projectId: projectId,
      photosProcessed: 0,
      s3FilesDeleted: [] as string[],
      s3Errors: [] as Array<{ key: string; error: string }>,
      databaseErrors: [] as string[]
    }

    // ✅ Verificar configuração do S3
    const s3Configured = isS3Configured()
    console.log(`🔧 S3 configurado: ${s3Configured}`)
    
    if (!s3Configured) {
      console.log(`⚠️ Variáveis de ambiente do S3:`, {
        AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: !!process.env.AWS_REGION,
        AWS_S3_BUCKET: !!process.env.AWS_S3_BUCKET
      })
    }

    // ✅ Deletar fotos do S3 (se existirem e S3 estiver configurado)
    if (existingProject.photos.length > 0) {
      console.log(`🗑️ Processando ${existingProject.photos.length} fotos para exclusão`)
      
      for (const photo of existingProject.photos) {
        deletionResult.photosProcessed++
        
        console.log(`📸 Processando foto: ${photo.filename}`, {
          isS3Stored: photo.isS3Stored,
          s3Key: photo.s3Key,
          s3Configured
        })
        
        if (photo.isS3Stored && photo.s3Key && s3Configured) {
            try {
              console.log(`🗑️ Deletando arquivos do S3 para foto: ${photo.filename} (chave: ${photo.s3Key})`)
              const s3DeletionResult = await deletePhotoVariants(photo.s3Key)
              
              // Adicionar arquivos deletados com sucesso
              deletionResult.s3FilesDeleted.push(...s3DeletionResult.deleted)
              
              // Adicionar erros do S3
              deletionResult.s3Errors.push(...s3DeletionResult.errors.map(err => ({
                key: err.key,
                error: err.error
              })))
              
              console.log(`✅ S3 deletion result for ${photo.s3Key}:`, {
                deleted: s3DeletionResult.deleted.length,
                errors: s3DeletionResult.errors.length,
                deletedFiles: s3DeletionResult.deleted,
                errorDetails: s3DeletionResult.errors
              })
            } catch (s3Error) {
              const errorMessage = s3Error instanceof Error ? s3Error.message : 'Erro desconhecido no S3'
              console.error(`❌ Erro ao deletar foto ${photo.id} do S3:`, s3Error)
              deletionResult.s3Errors.push({
                key: photo.s3Key,
                error: errorMessage
              })
            }
          } else {
            if (!photo.isS3Stored) {
              console.log(`ℹ️ Foto ${photo.filename} não está armazenada no S3`)
            } else if (!photo.s3Key) {
              console.log(`⚠️ Foto ${photo.filename} marcada como S3 mas sem chave S3`)
            } else if (!s3Configured) {
              console.log(`⚠️ S3 não configurado, pulando exclusão da foto ${photo.filename}`)
            }
          }
      }
    } else {
      console.log(`ℹ️ Projeto não possui fotos para deletar`)
    }

    // ✅ Deletar projeto do banco de dados (isso também deletará as fotos em cascata)
    try {
      console.log(`🗑️ Deletando projeto do banco de dados: ${projectId}`)
      
      // Usar transação para garantir consistência
      await prisma.$transaction(async (tx) => {
        // Primeiro, deletar todas as fotos associadas
        const deletedPhotos = await tx.photo.deleteMany({
          where: {
            projectId: projectId,
            userId: user.userId
          }
        })
        
        console.log(`🗑️ ${deletedPhotos.count} fotos deletadas do banco de dados`)
        
        // Depois, deletar o projeto
        await tx.project.delete({
          where: {
            id: projectId,
            userId: user.userId
          }
        })
        
        console.log(`✅ Projeto deletado do banco de dados: ${projectId}`)
      })
      
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Erro desconhecido no banco'
      console.error('❌ Erro ao deletar do banco de dados:', dbError)
      deletionResult.databaseErrors.push(errorMessage)
      
      return NextResponse.json(
        { 
          message: 'Erro ao deletar projeto do banco de dados',
          error: errorMessage,
          deletionResult
        },
        { status: 500 }
      )
    }

    // ✅ Preparar resposta com detalhes da exclusão
    const response = {
      message: 'Projeto deletado com sucesso',
      projectId: projectId,
      deletionSummary: {
        photosProcessed: deletionResult.photosProcessed,
        s3FilesDeleted: deletionResult.s3FilesDeleted.length,
        s3Errors: deletionResult.s3Errors.length,
        databaseErrors: deletionResult.databaseErrors.length,
        hasErrors: deletionResult.s3Errors.length > 0 || deletionResult.databaseErrors.length > 0
      },
      details: {
        s3FilesDeleted: deletionResult.s3FilesDeleted,
        s3Errors: deletionResult.s3Errors,
        databaseErrors: deletionResult.databaseErrors
      }
    }

    console.log(`🎉 Exclusão do projeto concluída:`, response.deletionSummary)

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Erro geral ao deletar projeto:', error)
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor ao deletar projeto',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    // ✅ Fechar conexão do Prisma
    await prisma.$disconnect()
  }
}