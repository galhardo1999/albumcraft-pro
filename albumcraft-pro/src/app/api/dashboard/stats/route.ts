import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

async function handler(request: NextRequest, user: any) {
  try {
    // Buscar estatísticas do usuário
    const [
      totalProjects,
      activeProjects,
      totalPhotos,
      photoStats
    ] = await Promise.all([
      // Total de projetos
      prisma.project.count({
        where: { userId: user.userId }
      }),
      
      // Projetos ativos (não concluídos)
      prisma.project.count({
        where: { 
          userId: user.userId,
          status: { in: ['DRAFT', 'IN_PROGRESS'] }
        }
      }),
      
      // Total de fotos
      prisma.photo.count({
        where: { userId: user.userId }
      }),
      
      // Estatísticas de armazenamento
      prisma.photo.aggregate({
        where: { userId: user.userId },
        _sum: {
          fileSize: true
        }
      })
    ])

    // Calcular armazenamento usado
    const totalBytes = photoStats._sum.fileSize || 0
    const storageUsed = formatBytes(totalBytes)

    const stats = {
      totalProjects,
      activeProjects,
      totalPhotos,
      storageUsed
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Erro ao carregar estatísticas'
        }
      },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const GET = withAuth(handler)