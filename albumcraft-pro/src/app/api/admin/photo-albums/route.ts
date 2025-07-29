import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-middleware';

// GET /api/admin/photo-albums - Listar álbuns
export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const where = eventId ? { eventId } : {};

    const albums = await prisma.photoAlbum.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      albums,
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin/photo-albums - Criar álbum
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { name, description, eventId } = body;

    if (!name || !eventId) {
      return NextResponse.json(
        { error: 'Nome e ID do evento são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o evento existe
    const event = await prisma.photoEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe um álbum com o mesmo nome no evento
    const existingAlbum = await prisma.photoAlbum.findFirst({
      where: {
        name,
        eventId,
      },
    });

    if (existingAlbum) {
      // Se já existe, retornar o álbum existente
      return NextResponse.json({
        success: true,
        album: existingAlbum,
        message: 'Álbum já existe',
      });
    }

    const album = await prisma.photoAlbum.create({
      data: {
        name,
        description,
        eventId,
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
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}