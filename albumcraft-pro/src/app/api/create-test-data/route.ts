import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Criar um usuário de teste se não existir
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'test-hash'
        }
      })
    }

    // Criar um projeto de teste
    const testProject = await prisma.project.create({
      data: {
        userId: testUser.id,
        name: 'Projeto de Teste S3',
        description: 'Projeto para testar exclusão do S3',
        albumSize: 'SIZE_20X20',
        template: 'classic',
        status: 'DRAFT'
      }
    })

    // Criar fotos de teste com configuração S3
    const testPhotos = await prisma.photo.createMany({
      data: [
        {
          userId: testUser.id,
          projectId: testProject.id,
          filename: 'test-photo-1.jpg',
          originalUrl: 'https://albumcraft-pro-photos.s3.us-east-1.amazonaws.com/users/test/projects/test/photos/test-photo-1.jpg',
          thumbnailUrl: 'https://albumcraft-pro-photos.s3.us-east-1.amazonaws.com/users/test/projects/test/photos/test-photo-1-thumbnail.jpg',
          mediumUrl: 'https://albumcraft-pro-photos.s3.us-east-1.amazonaws.com/users/test/projects/test/photos/test-photo-1-medium.jpg',
          fileSize: 1024000,
          width: 1920,
          height: 1080,
          mimeType: 'image/jpeg',
          s3Key: 'users/test/projects/test/photos/test-photo-1.jpg',
          s3Bucket: 'albumcraft-pro-photos',
          s3Region: 'us-east-1',
          isS3Stored: true
        },
        {
          userId: testUser.id,
          projectId: testProject.id,
          filename: 'test-photo-2.jpg',
          originalUrl: 'https://albumcraft-pro-photos.s3.us-east-1.amazonaws.com/users/test/projects/test/photos/test-photo-2.jpg',
          thumbnailUrl: 'https://albumcraft-pro-photos.s3.us-east-1.amazonaws.com/users/test/projects/test/photos/test-photo-2-thumbnail.jpg',
          mediumUrl: 'https://albumcraft-pro-photos.s3.us-east-1.amazonaws.com/users/test/projects/test/photos/test-photo-2-medium.jpg',
          fileSize: 2048000,
          width: 1920,
          height: 1080,
          mimeType: 'image/jpeg',
          s3Key: 'users/test/projects/test/photos/test-photo-2.jpg',
          s3Bucket: 'albumcraft-pro-photos',
          s3Region: 'us-east-1',
          isS3Stored: true
        }
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Dados de teste criados com sucesso',
      data: {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name
        },
        project: {
          id: testProject.id,
          name: testProject.name,
          description: testProject.description
        },
        photosCreated: testPhotos.count
      }
    })

  } catch (error) {
    console.error('Create test data error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}