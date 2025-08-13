import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'
import { UpdateAlbumSchema } from '@/lib/validations'
import { deletePhotoVariants, isS3Configured } from '@/lib/s3'

// GET /api/albums/[id] - Buscar álbum específico
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
    const album = await prisma.album.findFirst({
      where: {
        id: params.id,
        userId: user.userId // Garantir que o usuário só acesse seus próprios álbuns
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
    
    if (!album) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALBUM_NOT_FOUND',
          message: 'Álbum não encontrado'
        }
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: album
    })
  } catch (error) {
    console.error('Get album error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar álbum'
      }
    }, { status: 500 })
  }
}

// PUT /api/albums/[id] - Atualizar álbum
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
    const validatedData = UpdateAlbumSchema.parse(body)
    
    // Verificar se o álbum existe e pertence ao usuário
    const existingAlbum = await prisma.album.findFirst({
      where: {
        id: params.id,
        userId: user.userId
      }
    })
    
    if (!existingAlbum) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALBUM_NOT_FOUND',
          message: 'Álbum não encontrado'
        }
      }, { status: 404 })
    }
    
    // Atualizar álbum
    const settingsUpdate = validatedData.customWidth || validatedData.customHeight ? {
      ...(existingAlbum.settings as Record<string, unknown> || {}),
      customWidth: validatedData.customWidth,
      customHeight: validatedData.customHeight,
    } : existingAlbum.settings

    const album = await prisma.album.update({
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
      data: album
    })
    
  } catch (error) {
    console.error('Update album error:', error)
    
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
        message: 'Erro ao atualizar álbum'
      }
    }, { status: 500 })
  }
}

// DELETE /api/albums/[id] - Deletar álbum
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
    // Verificar se o álbum existe e pertence ao usuário
    const existingAlbum = await prisma.album.findFirst({
      where: {
        id: params.id,
        userId: user.userId
      },
      include: {
        pages: {
          include: {
            photoPlacement: {
              include: {
                photo: true
              }
            }
          }
        }
      }
    })
    
    if (!existingAlbum) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALBUM_NOT_FOUND',
          message: 'Álbum não encontrado'
        }
      }, { status: 404 })
    }

    // Coletar todas as fotos do álbum através dos photoPlacement
    const photos = existingAlbum.pages.flatMap(page => 
      page.photoPlacement.map(placement => placement.photo)
    )

    // Deletar fotos do S3 se estiverem configuradas
    if (photos.length > 0 && isS3Configured()) {
      const deletePromises = photos.map(async (photo) => {
        try {
          if (photo.isS3Stored && photo.s3Key) {
            await deletePhotoVariants(photo.s3Key)
            console.log(`Deleted photo variants for: ${photo.s3Key}`)
          }
        } catch (error) {
          console.error(`Error deleting photo ${photo.s3Key}:`, error)
          // Não falhar a operação se não conseguir deletar do S3
        }
      })

      await Promise.all(deletePromises)
    }

    // Usar transação para deletar álbum e dados relacionados
    await prisma.$transaction(async (tx) => {
      // Deletar photoPlacement primeiro
      await tx.photoPlacement.deleteMany({
        where: {
          page: {
            albumId: params.id
          }
        }
      })
      
      // Deletar páginas do álbum
      await tx.page.deleteMany({
        where: { albumId: params.id }
      })
      
      // Deletar o álbum
      await tx.album.delete({
        where: { id: params.id }
      })
    })
    
    return NextResponse.json({
      success: true,
      message: 'Álbum deletado com sucesso'
    })
    
  } catch (error) {
    console.error('Delete album error:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao deletar álbum'
      }
    }, { status: 500 })
  }
}