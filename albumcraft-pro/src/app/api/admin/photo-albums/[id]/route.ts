import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-middleware';
import { deleteFromS3 } from '@/lib/s3';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/photo-albums/[id] - Buscar álbum específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;

    const album = await prisma.photoAlbum.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        photos: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      album,
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/photo-albums/[id] - Atualizar álbum
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const album = await prisma.photoAlbum.update({
      where: { id },
      data: {
        name,
        description,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      album,
    });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/photo-albums/[id] - Excluir álbum
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;
    console.log(`🗑️ Iniciando exclusão do álbum: ${id}`);

    // Buscar álbum com fotos
    const album = await prisma.photoAlbum.findUnique({
      where: { id },
      include: {
        photos: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!album) {
      console.log(`❌ Álbum não encontrado: ${id}`);
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📊 Álbum encontrado: ${album.name} com ${album.photos.length} fotos`);

    // Excluir fotos do S3 se existirem
    if (album.photos.length > 0) {
      console.log(`🗑️ Excluindo ${album.photos.length} fotos do S3...`);
      
      const deletePromises = album.photos.map(async (photo) => {
        try {
          console.log(`🗑️ Excluindo foto do S3: ${photo.s3Key}`);
          await deleteFromS3(photo.s3Key);
          console.log(`✅ Foto excluída do S3: ${photo.s3Key}`);
          return { success: true, s3Key: photo.s3Key };
        } catch (error) {
          console.error(`❌ Erro ao excluir foto do S3: ${photo.s3Key}`, error);
          return { 
            success: false, 
            s3Key: photo.s3Key, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          };
        }
      });

      const s3Results = await Promise.allSettled(deletePromises);
      
      // Log dos resultados da exclusão do S3
      const successfulDeletions = s3Results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      const failedDeletions = s3Results.filter(result => 
        result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
      ).length;
      
      console.log(`📊 Resultado da exclusão do S3: ${successfulDeletions} sucessos, ${failedDeletions} falhas`);
      
      if (failedDeletions > 0) {
        console.warn(`⚠️ Algumas fotos não puderam ser excluídas do S3, mas continuando com a exclusão do banco de dados`);
      }
    }

    // Excluir álbum (cascade irá excluir as fotos do banco)
    console.log(`🗑️ Excluindo álbum do banco de dados: ${id}`);
    await prisma.photoAlbum.delete({
      where: { id },
    });
    
    console.log(`✅ Álbum excluído com sucesso: ${album.name}`);

    return NextResponse.json({
      success: true,
      message: 'Álbum excluído com sucesso',
      deletedAlbum: {
        id: album.id,
        name: album.name,
        photosCount: album.photos.length,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao excluir álbum:', error);
    
    // Verificar se é um erro específico do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'P2025':
          return NextResponse.json(
            { error: 'Álbum não encontrado' },
            { status: 404 }
          );
        case 'P2003':
          return NextResponse.json(
            { error: 'Não é possível excluir o álbum devido a dependências' },
            { status: 400 }
          );
        default:
          console.error('Erro do Prisma:', error);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}