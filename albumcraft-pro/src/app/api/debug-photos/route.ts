import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar todas as fotos do usuário com informações relevantes para S3
    const photos = await prisma.photo.findMany({
      where: {
        userId: user.userId
      },
      select: {
        id: true,
        filename: true,
        projectId: true,
        originalUrl: true,
        s3Key: true,
        s3Bucket: true,
        s3Region: true,
        isS3Stored: true,
        uploadedAt: true
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      take: 20 // Limitar a 20 fotos mais recentes
    })

    const summary = {
      totalPhotos: photos.length,
      s3StoredPhotos: photos.filter(p => p.isS3Stored).length,
      photosWithS3Key: photos.filter(p => p.s3Key).length,
      photosWithProject: photos.filter(p => p.projectId).length,
      photosReadyForS3Deletion: photos.filter(p => p.isS3Stored && p.s3Key).length
    }

    return NextResponse.json({
      success: true,
      summary,
      photos: photos.map(photo => ({
        id: photo.id,
        filename: photo.filename,
        projectId: photo.projectId,
        isS3Stored: photo.isS3Stored,
        hasS3Key: !!photo.s3Key,
        s3Key: photo.s3Key,
        s3Bucket: photo.s3Bucket,
        s3Region: photo.s3Region,
        originalUrl: photo.originalUrl,
        uploadedAt: photo.uploadedAt,
        readyForS3Deletion: photo.isS3Stored && !!photo.s3Key
      }))
    })

  } catch (error) {
    console.error('Debug photos error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}