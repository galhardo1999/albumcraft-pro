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
    const album = await prisma.album.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        pages: {
          include: {
            photoPlacement: {
              include: {
                photo: {
                  select: {
                    id: true,
                    filename: true,
                    s3Url: true
                  }
                }
              }
            }
          }
        },
        photos: {
          select: {
            id: true,
            filename: true,
            s3Url: true,
            size: true,
            createdAt: true
          }
        }
      }
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ album });
  } catch (error) {
    console.error('Erro ao buscar álbum:', error);
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
    const { name, description, status, albumSize } = body;

    const updatedAlbum = await prisma.album.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(albumSize && { albumSize })
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ album: updatedAlbum });
  } catch (error) {
    console.error('Erro ao atualizar álbum:', error);
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
    // Verificar se o álbum existe
    const album = await prisma.album.findUnique({
      where: { id: params.id }
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      );
    }

    // Deletar o álbum (cascade irá deletar páginas e relacionamentos)
    await prisma.album.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Álbum deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar álbum:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}