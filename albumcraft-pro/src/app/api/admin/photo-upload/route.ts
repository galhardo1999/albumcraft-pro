import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-middleware';
import { uploadToS3 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

// POST /api/admin/photo-upload - Upload de foto para álbum
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const albumId = formData.get('albumId') as string;

    if (!file || !albumId) {
      return NextResponse.json(
        { error: 'Arquivo e ID do álbum são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o álbum existe
    const album = await prisma.photoAlbum.findUnique({
      where: { id: albumId },
      include: {
        event: true,
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (máximo 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `gallery/${album.event.id}/${album.id}/${fileName}`;

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para S3
    const url = await uploadToS3(buffer, s3Key, file.type);

    // Salvar no banco de dados
    const photo = await prisma.photoGallery.create({
      data: {
        filename: file.name,
        s3Key,
        url,
        size: file.size,
        mimeType: file.type,
        albumId,
      },
      include: {
        album: {
          include: {
            event: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}