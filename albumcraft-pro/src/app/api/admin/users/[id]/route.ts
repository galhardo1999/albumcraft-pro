import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const params = await context.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        albums: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            pageCount: true,
            _count: {
              select: {
                photos: true
              }
            }
          }
        },
        photos: {
          select: {
            id: true,
            filename: true,
            size: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            albums: true,
            photos: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Compatibilidade com clientes que ainda esperam "projects", "uploadedAt" e "fileSize"
    const userWithCompatibility = {
      ...user,
      projects: user.albums.map((album) => ({
        id: album.id,
        name: album.name,
        status: album.status,
        createdAt: album.createdAt,
        _count: {
          pages: album.pageCount ?? 0,
          photos: album._count.photos
        }
      })),
      photos: user.photos.map((photo) => ({
        ...photo,
        fileSize: photo.size,
        uploadedAt: photo.createdAt
      })),
      _count: {
        ...user._count,
        projects: user._count.albums
      }
    };

    return NextResponse.json({ user: userWithCompatibility });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const params = await context.params;

  try {
    const body = await request.json();
    const { name, email, plan, isAdmin } = body;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(plan && { plan }),
        ...(typeof isAdmin === 'boolean' && { isAdmin })
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const params = await context.params;

  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir deletar o próprio admin
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Não é possível deletar um usuário administrador' },
        { status: 400 }
      );
    }

    // Deletar o usuário (cascade irá deletar álbuns e fotos relacionadas)
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}