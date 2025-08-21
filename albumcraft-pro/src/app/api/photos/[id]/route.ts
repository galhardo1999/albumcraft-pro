import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'
import { deletePhotoVariants, isS3Configured } from '@/lib/s3'
import { prisma } from '@/lib/prisma'

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
    const { albumId } = body

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

    // Se albumId foi fornecido, verificar se o álbum existe e pertence ao usuário
    if (albumId) {
      const album = await prisma.album.findFirst({
        where: {
          id: albumId,
          userId: user.userId
        }
      })

      if (!album) {
        return NextResponse.json(
          { message: 'Álbum não encontrado' },
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
        albumId: albumId || null
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
    const photoId = params.id

    console.log(`🗑️ Iniciando exclusão da foto: ${photoId} para usuário: ${user.userId}`)

    // ✅ Verificar se a foto existe e pertence ao usuário
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id: photoId,
        userId: user.userId
      }
    })

    if (!existingPhoto) {
      console.log(`❌ Foto não encontrada: ${photoId}`)
      return NextResponse.json(
        { message: 'Foto não encontrada' },
        { status: 404 }
      )
    }

    console.log(`📸 Foto encontrada:`, {
      id: existingPhoto.id,
      filename: existingPhoto.filename,
      s3Key: existingPhoto.s3Key
    })

    // ✅ Deletar arquivos do S3 (se existirem)
    let s3DeletionResult: { deleted: string[]; errors: { key: string; error: string }[] } = { deleted: [], errors: [] }
    
    if (isS3Configured() && existingPhoto.s3Key) {
      try {
        console.log(`🗑️ Deletando arquivos do S3 para chave: ${existingPhoto.s3Key}`)
        s3DeletionResult = await deletePhotoVariants(existingPhoto.s3Key)
        
        console.log(`✅ Resultado da exclusão S3:`, {
          deleted: s3DeletionResult.deleted,
          errors: s3DeletionResult.errors
        })
      } catch (s3Error) {
        console.error('❌ Erro ao deletar do S3:', s3Error)
        // Continuar com a exclusão do banco mesmo se o S3 falhar
        s3DeletionResult.errors.push({
          key: existingPhoto.s3Key,
          error: s3Error instanceof Error ? s3Error.message : 'Erro desconhecido no S3'
        })
      }
    } else {
      console.log(`ℹ️ S3 não configurado ou foto sem chave S3, pulando exclusão de arquivos`)
    }

    // ✅ Deletar registro do banco de dados
    try {
      await prisma.photo.delete({
        where: {
          id: photoId
        }
      })
      console.log(`✅ Foto deletada do banco de dados: ${photoId}`)
    } catch (dbError) {
      console.error('❌ Erro ao deletar do banco de dados:', dbError)
      return NextResponse.json(
        { 
          message: 'Erro ao deletar foto do banco de dados',
          error: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    }

    // ✅ Preparar resposta com detalhes da exclusão
    const response = {
      message: 'Foto deletada com sucesso',
      photoId: photoId,
      s3Deletion: {
        filesDeleted: s3DeletionResult.deleted,
        errors: s3DeletionResult.errors,
        totalDeleted: s3DeletionResult.deleted.length,
        hasErrors: s3DeletionResult.errors.length > 0
      }
    }

    console.log(`🎉 Exclusão concluída:`, response)

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Erro geral ao deletar foto:', error)
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor ao deletar foto',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    // ✅ Fechar conexão do Prisma
    await prisma.$disconnect()
  }
}