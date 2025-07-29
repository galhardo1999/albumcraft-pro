import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const params = await context.params;
    const { id } = params;

    const event = await prisma.photoEvent.findUnique({
      where: { id },
      include: {
        albums: {
          include: {
            _count: {
              select: {
                photos: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            albums: true,
            users: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Error fetching photo event:', error);
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
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { name, description, userIds } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do evento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o evento existe
    const existingEvent = await prisma.photoEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o evento
    const event = await prisma.photoEvent.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    // Gerenciar usuários se fornecidos
    if (Array.isArray(userIds)) {
      // Remover todos os usuários existentes
      await prisma.photoEvent.update({
        where: { id },
        data: {
          users: {
            set: [], // Remove todas as conexões existentes
          },
        },
      });

      // Adicionar os novos usuários
      if (userIds.length > 0) {
        // Verificar se todos os usuários existem
        const users = await prisma.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },
        });

        if (users.length !== userIds.length) {
          return NextResponse.json(
            { error: 'Um ou mais usuários não foram encontrados' },
            { status: 400 }
          );
        }

        // Conectar os usuários ao evento
        await prisma.photoEvent.update({
          where: { id },
          data: {
            users: {
              connect: userIds.map((userId: string) => ({ id: userId })),
            },
          },
        });
      }
    }

    // Buscar o evento atualizado com todas as relações
    const updatedEvent = await prisma.photoEvent.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            albums: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating photo event:', error);
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
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const params = await context.params;
    const { id } = params;

    // Verificar se o evento existe
    const event = await prisma.photoEvent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            albums: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Deletar o evento (cascade irá deletar álbuns e fotos relacionadas)
    await prisma.photoEvent.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Evento excluído com sucesso',
    });
  } catch (error) {
    console.error('Error deleting photo event:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}