import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // dias

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Estatísticas gerais
    const [
      totalUsers,
      totalProjects,
      totalPhotos,
      newUsers,
      newProjects,
      newPhotos,
      previousPeriodUsers,
      previousPeriodProjects,
      previousPeriodPhotos
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de álbuns
      prisma.album.count(),
      
      // Total de fotos
      prisma.photo.count(),
      
      // Novos usuários no período
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Novos álbuns no período
      prisma.album.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Novas fotos no período
      prisma.photo.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Usuários do período anterior (para calcular crescimento)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        }
      }),
      
      // Álbuns do período anterior
      prisma.album.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        }
      }),

      // Fotos do período anterior
      prisma.photo.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        }
      })
    ])

    // Calcular taxas de crescimento
    const userGrowthRate = previousPeriodUsers > 0 
      ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
      : newUsers > 0 ? 100 : 0

    const projectGrowthRate = previousPeriodProjects > 0 
      ? ((newProjects - previousPeriodProjects) / previousPeriodProjects) * 100 
      : newProjects > 0 ? 100 : 0

    const photoGrowthRate = previousPeriodPhotos > 0 
      ? ((newPhotos - previousPeriodPhotos) / previousPeriodPhotos) * 100 
      : newPhotos > 0 ? 100 : 0

    // Calcular armazenamento usado (estimativa baseada no número de fotos)
    const averagePhotoSize = 2.5 // MB por foto (estimativa)
    const totalStorageMB = totalPhotos * averagePhotoSize
    const storageUsed = totalStorageMB > 1024 
      ? `${(totalStorageMB / 1024).toFixed(1)} GB`
      : `${totalStorageMB.toFixed(0)} MB`

    // Álbuns por status
    const projectsByStatus = await prisma.album.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Usuários por plano
    const usersByPlan = await prisma.user.groupBy({
      by: ['plan'],
      _count: {
        id: true
      }
    })

    // Top usuários mais ativos (com mais álbuns)
    const topActiveUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        _count: { select: { albums: true, photos: true } }
      },
      orderBy: { albums: { _count: 'desc' } },
      take: 10
    })

    // Atividade recente
    const recentActivity: Array<{
      id: string;
      type: 'user_created' | 'project_created' | 'photo_uploaded';
      description: string;
      timestamp: string;
      user?: string;
    }> = []

    // Usuários criados recentemente
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Álbuns criados recentemente
    const recentProjects = await prisma.album.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Fotos enviadas recentemente
    const recentPhotos = await prisma.photo.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        id: true,
        filename: true,
        createdAt: true,
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Combinar atividades
    recentUsers.forEach(user => {
      recentActivity.push({
        id: `user_${user.id}`,
        type: 'user_created' as const,
        description: `Novo usuário cadastrado: ${user.name}`,
        timestamp: user.createdAt.toISOString(),
        user: user.name
      })
    })

    recentProjects.forEach(project => {
      recentActivity.push({
        id: `album_${project.id}`,
        type: 'project_created' as const,
        description: `Novo álbum criado: ${project.name}`,
        timestamp: project.createdAt.toISOString(),
        user: project.user.name
      })
    })

    recentPhotos.forEach(photo => {
      recentActivity.push({
        id: `photo_${photo.id}`,
        type: 'photo_uploaded' as const,
        description: `Nova foto enviada: ${photo.filename}`,
        timestamp: photo.createdAt.toISOString(),
        user: photo.user.name
      })
    })

    // Ordenar atividades por data
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const reportData = {
      period: periodDays,
      overview: {
        totalUsers,
        totalProjects,
        totalPhotos,
        newUsers,
        newProjects,
        newPhotos,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        projectGrowthRate: Math.round(projectGrowthRate * 100) / 100,
        photoGrowthRate: Math.round(photoGrowthRate * 100) / 100,
        storageUsed
      },
      // Mantém projectsByStatus por compatibilidade com o front atual
      projectsByStatus: projectsByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      usersByPlan: usersByPlan.map(item => ({
        plan: item.plan,
        count: item._count.id
      })),
      topActiveUsers: topActiveUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        projectCount: user._count.albums,
        photoCount: user._count.photos
      })),
      recentActivity: recentActivity.slice(0, 20)
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}