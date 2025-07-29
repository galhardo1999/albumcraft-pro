import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const events = await prisma.photoEvent.findMany({
      include: {
        _count: {
          select: {
            albums: true,
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Error fetching photo events:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { name, description, userIds } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do evento é obrigatório' },
        { status: 400 }
      );
    }

    // Validar userIds se fornecidos
    if (userIds && (!Array.isArray(userIds) || !userIds.every(id => typeof id === 'string'))) {
      return NextResponse.json(
        { error: 'IDs de usuários devem ser um array de strings' },
        { status: 400 }
      );
    }

    // Se userIds foram fornecidos, verificar se todos os usuários existem
    if (userIds && userIds.length > 0) {
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
    }

    const event = await prisma.photoEvent.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        users: userIds && userIds.length > 0 ? {
          connect: userIds.map((id: string) => ({ id }))
        } : undefined,
      },
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
      event,
    });
  } catch (error) {
    console.error('Error creating photo event:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}