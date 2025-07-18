import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deletePhotoVariants } from '@/lib/s3'
import { isS3Configured } from '@/lib/s3'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const projectId = params.id

    console.log(`🗑️ [TEST] Iniciando exclusão do projeto: ${projectId}`)

    // Buscar o projeto e suas fotos (sem verificação de usuário para teste)
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId
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
      console.log(`❌ [TEST] Projeto não encontrado: ${projectId}`)
      return NextResponse.json(
        { message: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    console.log(`📂 [TEST] Projeto encontrado:`, {
      id: existingProject.id,
      name: existingProject.name,
      photosCount: existingProject.photos.length
    })

    // Preparar resultado da exclusão
    const deletionResult = {
      projectId: projectId,
      photosProcessed: 0,
      s3FilesDeleted: [] as string[],
      s3Errors: [] as Array<{ key: string; error: string }>,
      databaseErrors: [] as string[]
    }

    // Verificar configuração do S3
    const s3Configured = isS3Configured()
    console.log(`🔧 [TEST] S3 configurado: ${s3Configured}`)

    // Deletar fotos do S3 (se existirem e S3 estiver configurado)
    if (existingProject.photos.length > 0) {
      console.log(`🗑️ [TEST] Processando ${existingProject.photos.length} fotos para exclusão`)
      
      for (const photo of existingProject.photos) {
        deletionResult.photosProcessed++
        
        console.log(`📸 [TEST] Processando foto: ${photo.filename}`, {
          isS3Stored: photo.isS3Stored,
          s3Key: photo.s3Key,
          s3Configured
        })
        
        if (photo.isS3Stored && photo.s3Key && s3Configured) {
          try {
            console.log(`🗑️ [TEST] Deletando arquivos do S3 para foto: ${photo.filename} (chave: ${photo.s3Key})`)
            const s3DeletionResult = await deletePhotoVariants(photo.s3Key)
            
            // Adicionar arquivos deletados com sucesso
            deletionResult.s3FilesDeleted.push(...s3DeletionResult.deleted)
            
            // Adicionar erros do S3
            deletionResult.s3Errors.push(...s3DeletionResult.errors.map(err => ({
              key: err.key,
              error: err.error
            })))
            
            console.log(`✅ [TEST] S3 deletion result for ${photo.s3Key}:`, {
              deleted: s3DeletionResult.deleted.length,
              errors: s3DeletionResult.errors.length,
              deletedFiles: s3DeletionResult.deleted,
              errorDetails: s3DeletionResult.errors
            })
          } catch (s3Error) {
            const errorMessage = s3Error instanceof Error ? s3Error.message : 'Erro desconhecido no S3'
            console.error(`❌ [TEST] Erro ao deletar foto ${photo.id} do S3:`, s3Error)
            deletionResult.s3Errors.push({
              key: photo.s3Key,
              error: errorMessage
            })
          }
        } else {
          if (!photo.isS3Stored) {
            console.log(`ℹ️ [TEST] Foto ${photo.filename} não está armazenada no S3`)
          } else if (!photo.s3Key) {
            console.log(`⚠️ [TEST] Foto ${photo.filename} marcada como S3 mas sem chave S3`)
          } else if (!s3Configured) {
            console.log(`⚠️ [TEST] S3 não configurado, pulando exclusão da foto ${photo.filename}`)
          }
        }
      }
    } else {
      console.log(`ℹ️ [TEST] Projeto não possui fotos para deletar`)
    }

    // Deletar projeto do banco de dados (isso também deletará as fotos em cascata)
    try {
      console.log(`🗑️ [TEST] Deletando projeto do banco de dados: ${projectId}`)
      
      // Usar transação para garantir consistência
      await prisma.$transaction(async (tx) => {
        // Primeiro, deletar todas as fotos associadas
        const deletedPhotos = await tx.photo.deleteMany({
          where: {
            projectId: projectId
          }
        })
        
        console.log(`🗑️ [TEST] ${deletedPhotos.count} fotos deletadas do banco de dados`)
        
        // Depois, deletar o projeto
        await tx.project.delete({
          where: {
            id: projectId
          }
        })
        
        console.log(`✅ [TEST] Projeto deletado do banco de dados: ${projectId}`)
      })
      
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Erro desconhecido no banco'
      console.error('❌ [TEST] Erro ao deletar do banco de dados:', dbError)
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

    // Preparar resposta com detalhes da exclusão
    const response = {
      message: '[TEST] Projeto deletado com sucesso',
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

    console.log(`🎉 [TEST] Exclusão do projeto concluída:`, response.deletionSummary)

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ [TEST] Erro geral ao deletar projeto:', error)
    return NextResponse.json(
      { 
        message: '[TEST] Erro interno do servidor ao deletar projeto',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    // Fechar conexão do Prisma
    await prisma.$disconnect()
  }
}