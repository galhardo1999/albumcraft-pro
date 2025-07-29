import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import { deleteFromS3 } from '@/lib/s3'

// GET /api/admin/photo-galleries/[id] - Obter foto específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const photo = await prisma.photoGallery.findUnique({
      where: { id: params.id },
      include: {
        album: {
          include: {
            event: true,
          },
        },
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(photo)
  } catch (error) {
    console.error('Erro ao buscar foto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/photo-galleries/[id] - Atualizar foto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const body = await request.json()
    const { filename, albumId } = body

    // Verificar se a foto existe
    const existingPhoto = await prisma.photoGallery.findUnique({
      where: { id: params.id },
    })

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      )
    }

    // Se albumId foi fornecido, verificar se o álbum existe
    if (albumId) {
      const album = await prisma.photoAlbum.findUnique({
        where: { id: albumId },
      })

      if (!album) {
        return NextResponse.json(
          { error: 'Álbum não encontrado' },
          { status: 404 }
        )
      }
    }

    // Atualizar a foto
    const updatedPhoto = await prisma.photoGallery.update({
      where: { id: params.id },
      data: {
        ...(filename && { filename }),
        ...(albumId && { albumId }),
      },
      include: {
        album: {
          include: {
            event: true,
          },
        },
      },
    })

    return NextResponse.json(updatedPhoto)
  } catch (error) {
    console.error('Erro ao atualizar foto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/photo-galleries/[id] - Deletar foto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    // Buscar a foto para obter a chave S3
    const photo = await prisma.photoGallery.findUnique({
      where: { id: params.id },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      )
    }

    // Deletar do S3
    try {
      await deleteFromS3(photo.s3Key)
    } catch (s3Error) {
      console.error('Erro ao deletar do S3:', s3Error)
      // Continuar com a exclusão do banco mesmo se falhar no S3
    }

    // Deletar do banco de dados
    await prisma.photoGallery.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Foto deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar foto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}