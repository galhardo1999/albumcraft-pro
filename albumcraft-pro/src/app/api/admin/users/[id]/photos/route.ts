import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users/[id]/photos - Buscar fotos de um usuário específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Buscar fotos do usuário
    const photos = await prisma.photo.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        filename: true,
        s3Url: true,
        width: true,
        height: true,
        size: true,
        createdAt: true,
        albumId: true,
        album: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Normalizar saída adicionando alias url -> s3Url
    const photosPayload = photos.map(p => ({ ...p, url: p.s3Url }))

    return NextResponse.json({
      success: true,
      data: photosPayload,
      user: user
    });

  } catch (error) {
    console.error('Erro ao buscar fotos do usuário:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}